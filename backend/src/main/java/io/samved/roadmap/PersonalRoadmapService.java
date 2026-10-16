package io.samved.roadmap;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.assessment.AssessmentService;
import io.samved.common.*;
import io.samved.student.*;
import java.net.URI;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Recommendations explain real profile/assessment matches; manual choices remain available independently. */
@Service @Transactional
public class PersonalRoadmapService {
    public record Section(String key,String title,boolean complete,String href,String detail) { }
    public record Checklist(int completed,int total,boolean ready,List<Section> sections) { }
    public record Choice(String slug,String title,String description,String url,List<String> reasons) { }
    public record Guidance(Checklist checklist,List<Choice> recommended,List<Choice> saved,String activeSlug,String message) { }
    public record Preferences(List<String> savedSlugs,String activeSlug) { }
    private record Signal(String label,String query,int weight) { }
    private record Match(Choice choice,int score) { }
    private static final Set<String> STOP=Set.of("a","an","and","the","of","to","in","for","with","thinking","learning","problem","solving","other");
    private static final Map<String,List<String>> ALIASES=Map.ofEntries(
        Map.entry("software engineer",List.of("frontend","backend","full-stack")),
        Map.entry("technology",List.of("frontend","backend","full-stack","computer-science")),
        Map.entry("programming",List.of("computer-science","backend","frontend")),
        Map.entry("coding",List.of("computer-science","backend","frontend")),
        Map.entry("data scientist",List.of("ai-data-scientist","data-analyst","python","sql")),
        Map.entry("data science",List.of("ai-data-scientist","data-analyst","python","sql")),
        Map.entry("research",List.of("ai-data-scientist","data-analyst","python")),
        Map.entry("science",List.of("ai-data-scientist","data-analyst")),
        Map.entry("mathematics",List.of("data-analyst","ai-data-scientist","sql")),
        Map.entry("analytical thinking",List.of("data-analyst","computer-science")),
        Map.entry("design",List.of("ux-design","design-system","frontend")),
        Map.entry("designer",List.of("ux-design","design-system")),
        Map.entry("creativity",List.of("ux-design","design-system")),
        Map.entry("business",List.of("product-manager","engineering-manager")),
        Map.entry("leadership",List.of("product-manager","engineering-manager")),
        Map.entry("cybersecurity",List.of("cyber-security")),
        Map.entry("cybersecurity specialist",List.of("cyber-security")));
    private final ProfileService profiles;
    private final StudentContext student;
    private final AssessmentService assessment;
    private final ParseRoadmapCatalogue catalogue;
    private final StudentProfileRepository repository;
    private final ObjectMapper json;
    public PersonalRoadmapService(ProfileService profiles,StudentContext student,AssessmentService assessment,
        ParseRoadmapCatalogue catalogue,StudentProfileRepository repository,ObjectMapper json) {
        this.profiles=profiles;this.student=student;this.assessment=assessment;this.catalogue=catalogue;this.repository=repository;this.json=json;
    }
    public Checklist checklist() { return checklist(profiles.view(student.requireStudentId())); }
    private Checklist checklist(ProfileService.View p) {
        var reviewed=new HashSet<>(p.reviewedSections());
        var current=assessment.current(); boolean assessmentComplete=false;
        if(current.answers().size()==current.questions().size()) {
            try {assessment.result();assessmentComplete=true;}
            catch(ApiException error){if(error.status()!=org.springframework.http.HttpStatus.BAD_REQUEST&&error.status()!=org.springframework.http.HttpStatus.NOT_FOUND)throw error;}
        }
        List<Section> sections=List.of(
            new Section("profile","Personal details",!p.name().isBlank()&&!p.educationLevel().isBlank(),"/profile/profile.html","Name and education level"),
            section("academics","Academic background",!p.academics().isEmpty(),"academic","Add your academic background and subjects"),
            section("career","Career direction",!p.careerGoal().type().equals("EXPLORING")||reviewed.contains("career"),"careergoal","A goal, or an explicit choice to keep exploring"),
            section("interests","Interests",!p.interests().isEmpty(),"interests","Tell us what you enjoy"),
            section("skills","Skills",!p.skills().isEmpty(),"skills","Skills and your current level"),
            section("strengths","Strengths",!p.strengths().isEmpty(),"strengths","How you approach work and learning"),
            section("values","Values",!p.values().isEmpty(),"values","What matters to you"),
            new Section("assessment","Career assessment",assessmentComplete,"/assessment/assessment.html",current.answers().size()+" of "+current.questions().size()+" questions answered"));
        int complete=(int)sections.stream().filter(Section::complete).count();return new Checklist(complete,sections.size(),complete==sections.size(),sections);
    }
    private Section section(String key,String title,boolean complete,String page,String detail){return new Section(key,title,complete,"/profile/"+page+".html",detail);}
    public Guidance guidance() {
        long id=student.requireStudentId();var p=profiles.view(id);var checklist=checklist(p);var prefs=preferences(profiles.require(id));
        List<ParseRoadmapCatalogue.RoadmapSummary> items;
        try { items=catalogue.list(); }
        catch(ApiException error) {
            if(error.status()!=org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)throw error;
            return new Guidance(checklist,List.of(),saved(prefs,List.of()),prefs.activeSlug(),"The roadmap catalogue is temporarily unavailable. Your saved choices are kept; try again later.");
        }
        List<Choice> recommendations=checklist.ready()?rank(p,assessment.result().leadingDimensions(),items):List.of();
        String message=!checklist.ready()?"Complete every profile section and the career assessment to unlock recommendations. All features unlock after completion."
            :recommendations.isEmpty()?"Your surveys are complete. This developer-focused catalogue has no clear match to your answers yet. You can still choose any available roadmap."
            :"Learning options for your "+p.educationLevel().replace('-',' ')+" stage, matched to your saved interests, skills, career direction and assessment. These are not predictions; grades are not used to exclude paths.";
        return new Guidance(checklist,recommendations,saved(prefs,items),prefs.activeSlug(),message);
    }
    private List<Choice> saved(Preferences prefs,List<ParseRoadmapCatalogue.RoadmapSummary> items){
        return prefs.savedSlugs().stream().map(slug->items.stream().filter(item->slug.equals(slug(item))).findFirst()
            .map(item->choice(item,List.of("Chosen by you")))
            .orElse(new Choice(slug,slug.replace('-',' '),"Your saved roadmap", "https://roadmap.sh/"+slug,List.of("Chosen by you")))).toList();
    }
    public List<Choice> rank(ProfileService.View p,List<String> themes,List<ParseRoadmapCatalogue.RoadmapSummary> items){
        List<Signal> signals=new ArrayList<>();
        p.interests().forEach(value->signals.add(new Signal("Interest: "+value,value,6)));
        p.skills().forEach(skill->signals.add(new Signal("Skill: "+skill.name(),skill.name(),5)));
        p.strengths().forEach(value->signals.add(new Signal("Strength: "+value,value,2)));
        p.values().forEach(value->signals.add(new Signal("Value: "+value,value,1)));
        if(!p.careerGoal().type().equals("EXPLORING")&&p.careerGoal().text()!=null)signals.add(new Signal("Goal: "+p.careerGoal().text(),p.careerGoal().text(),9));
        for(String theme:themes){String query=switch(theme){case "TECHNOLOGY"->"technology";case "RESEARCH"->"research";case "CREATIVITY"->"design";case "LEADERSHIP"->"leadership";default->null;};
            if(query!=null)signals.add(new Signal("Assessment: "+theme.toLowerCase(Locale.ROOT),query,3));}
        List<Match> matches=new ArrayList<>();
        for(var item:items){int score=0;List<String> reasons=new ArrayList<>();
            for(var signal:signals){int points=match(item,signal.query());if(points>0){score+=points*signal.weight();reasons.add(signal.label());}}
            if(score>0)matches.add(new Match(choice(item,reasons.stream().distinct().limit(4).toList()),score));
        }
        return matches.stream().sorted(Comparator.comparingInt(Match::score).reversed().thenComparing(m->m.choice().title()))
            .limit(6).map(Match::choice).toList();
    }
    private int match(ParseRoadmapCatalogue.RoadmapSummary item,String query){
        String normalized=normalize(query),title=normalize(item.title()+" "+item.id()+" "+String.join(" ",item.tags()));
        if(normalized.isBlank())return 0;
        int aliasIndex=ALIASES.getOrDefault(normalized,List.of()).indexOf(item.id());
        if(aliasIndex>=0)return 6-Math.min(3,aliasIndex);
        Set<String> words=new HashSet<>(Arrays.asList(title.split(" ")));int points=0;
        for(String term:new HashSet<>(Arrays.asList(normalized.split(" "))))if(term.length()>1&&!STOP.contains(term)&&words.contains(term))points+=2;
        return points;
    }
    private String normalize(String value){return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();}
    private Choice choice(ParseRoadmapCatalogue.RoadmapSummary item,List<String> reasons){return new Choice(slug(item),item.title(),item.description(),item.url(),reasons);}
    private String slug(ParseRoadmapCatalogue.RoadmapSummary item){
        URI uri=URI.create(item.url());String query=uri.getQuery();return query!=null&&query.startsWith("r=")?query.substring(2):uri.getPath().substring(1);
    }
    public Guidance save(String slug){
        validate(slug);var item=catalogue.list().stream().filter(r->slug.equals(slug(r))).findFirst().orElseThrow(()->ApiException.notFound("Choose a roadmap from the available catalogue."));
        var p=profiles.require(student.requireStudentId());var prefs=preferences(p);var saved=new ArrayList<>(prefs.savedSlugs());
        if(!saved.contains(slug)){if(saved.size()>=20)throw ApiException.badRequest("You can save up to 20 roadmaps. Remove one before adding another.");saved.add(slug);}
        store(p,new Preferences(saved,slug));return guidance();
    }
    public Guidance activate(String slug){validate(slug);var p=profiles.require(student.requireStudentId());var prefs=preferences(p);
        if(!prefs.savedSlugs().contains(slug))throw ApiException.notFound("Save this roadmap before making it active.");store(p,new Preferences(prefs.savedSlugs(),slug));return guidance();}
    public Guidance remove(String slug){validate(slug);var p=profiles.require(student.requireStudentId());var prefs=preferences(p);var saved=prefs.savedSlugs().stream().filter(s->!s.equals(slug)).toList();
        store(p,new Preferences(saved,slug.equals(prefs.activeSlug())?(saved.isEmpty()?null:saved.get(0)):prefs.activeSlug()));return guidance();}
    private void validate(String slug){if(slug==null||!slug.matches("[a-z0-9][a-z0-9-]{0,99}"))throw ApiException.badRequest("Invalid roadmap.");}
    private Preferences preferences(StudentProfile p){try{return json.readValue(p.roadmapPreferences,Preferences.class);}catch(Exception e){throw new IllegalStateException("Saved roadmap preferences could not be read",e);}}
    private void store(StudentProfile p,Preferences prefs){try{p.roadmapPreferences=json.writeValueAsString(prefs);}catch(Exception e){throw new IllegalStateException(e);}repository.saveAndFlush(p);}
}
