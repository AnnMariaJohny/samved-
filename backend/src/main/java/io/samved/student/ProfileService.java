package io.samved.student;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProfileService implements StudentProfilePort {
    public record Goal(@NotBlank String type, @Size(max=160) String text) { }
    public record Details(@NotBlank @Size(max=100) String name, @NotBlank String educationLevel,
                          @NotNull @Size(max=100) String cityRegion, @NotNull @Valid Goal careerGoal) { }
    public record Skill(@NotBlank @Size(max=80) String name, @NotBlank String proficiency) { }
    public record Subject(@NotBlank @Size(max=100) String name,
                          @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=2) BigDecimal marks) { }
    public record Academic(@NotBlank String educationLevel, @NotBlank @Size(max=160) String institution,
                           @NotBlank @Size(max=160) String course, @NotBlank String periodType,
                           @Min(1) @Max(20) int period, @NotBlank String scoreType,
                           @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=2) BigDecimal score,
                           @NotEmpty @Size(max=20) List<@NotNull @Valid Subject> subjects) { }
    public record View(long id, String email, String name, String educationLevel, String cityRegion,
                       Goal careerGoal, List<String> interests, List<Skill> skills, List<String> strengths,
                       List<String> values, List<Academic> academics, List<String> reviewedSections) { }
    private static final Set<String> EDUCATION = Set.of("school","higher-secondary","undergraduate","postgraduate","other");
    private final StudentProfileRepository profiles;
    private final ObjectMapper json;
    public ProfileService(StudentProfileRepository profiles, ObjectMapper json) { this.profiles=profiles; this.json=json; }

    public static void education(String value) {
        if (!EDUCATION.contains(value)) throw ApiException.badRequest("Select a valid education level.");
    }
    public StudentProfile require(long id) {
        return profiles.findById(id).orElseThrow(() -> ApiException.unauthorized("Sign in again to continue."));
    }
    public View view(long id) { return view(require(id)); }
    public View view(StudentProfile p) {
        return new View(p.id, p.account.email, p.name, p.educationLevel, p.cityRegion,
            new Goal(p.goalType,p.goalText), read(p.interests,new TypeReference<>(){}),
            read(p.skills,new TypeReference<>(){}),read(p.strengths,new TypeReference<>(){}),
            read(p.valuesJson,new TypeReference<>(){}),read(p.academics,new TypeReference<>(){}),read(p.reviewedSections,new TypeReference<>(){}));
    }
    public View update(long id, Details input) {
        education(input.educationLevel());
        if (input.name().isBlank()) throw ApiException.badRequest("Enter your name.");
        Goal goal=input.careerGoal();
        if (!Set.of("SELECTED","CUSTOM","EXPLORING").contains(goal.type())) throw ApiException.badRequest("Invalid career goal type.");
        if (!goal.type().equals("EXPLORING") && (goal.text()==null || goal.text().isBlank()))
            throw ApiException.badRequest("Enter a career goal or choose exploring.");
        if (goal.type().equals("SELECTED") && !Set.of("Scientist","Software Engineer","Doctor","Researcher",
            "Entrepreneur","Teacher","Designer","Government Service","Data Scientist","AI / ML Engineer",
            "Cybersecurity Specialist","Civil Engineer","Mechanical Engineer","Electrical Engineer",
            "Business / Management","Lawyer","Psychologist","Content Creator").contains(goal.text()))
            throw ApiException.badRequest("Choose a listed career or use a custom goal.");
        StudentProfile p=require(id);
        p.name=input.name().trim(); p.educationLevel=input.educationLevel(); p.cityRegion=input.cityRegion().trim();
        p.goalType=goal.type(); p.goalText=goal.type().equals("EXPLORING")?null:goal.text().trim();
        markReviewed(p,"profile");
        return view(profiles.saveAndFlush(p));
    }
    public List<String> selections(long id, String section) {
        StudentProfile p=require(id);
        return read(switch(section) { case "interests"->p.interests; case "strengths"->p.strengths; case "values"->p.valuesJson; default->throw ApiException.notFound("Unknown section."); },new TypeReference<>(){});
    }
    public List<String> saveSelections(long id,String section,List<String> labels) {
        if (labels==null || labels.size()>30) throw ApiException.badRequest("Choose at most 30 items.");
        Set<String> seen=new HashSet<>(); List<String> clean=new ArrayList<>();
        for(String label:labels) {
            if(label==null || label.isBlank() || label.length()>80 || !seen.add(label.trim().toLowerCase(Locale.ROOT)))
                throw ApiException.badRequest("Selections must be distinct, non-empty labels up to 80 characters.");
            clean.add(label.trim());
        }
        StudentProfile p=require(id); String data=write(clean);
        switch(section) { case "interests"->p.interests=data; case "strengths"->p.strengths=data; case "values"->p.valuesJson=data; default->throw ApiException.notFound("Unknown section."); }
        markReviewed(p,section);
        profiles.saveAndFlush(p); return clean;
    }
    public List<Skill> skills(long id) { return read(require(id).skills,new TypeReference<>(){}); }
    public List<Skill> saveSkills(long id,List<Skill> skills) {
        if(skills.size()>50) throw ApiException.badRequest("Add at most 50 skills.");
        Set<String> names=new HashSet<>();
        for(Skill skill:skills) {
            if(!Set.of("BEGINNER","INTERMEDIATE","ADVANCED").contains(skill.proficiency()) || !names.add(skill.name().trim().toLowerCase(Locale.ROOT)))
                throw ApiException.badRequest("Use distinct skills with a valid proficiency.");
        }
        StudentProfile p=require(id); p.skills=write(skills); markReviewed(p,"skills"); profiles.saveAndFlush(p); return skills;
    }
    public List<Academic> academics(long id) { return read(require(id).academics,new TypeReference<>(){}); }
    public List<Academic> saveAcademics(long id,List<Academic> records) {
        if(records.size()>10) throw ApiException.badRequest("Add at most 10 academic records.");
        Set<String> seen=new HashSet<>();
        for(Academic r:records) {
            education(r.educationLevel());
            if(!Set.of("CLASS","SEMESTER").contains(r.periodType()) || !Set.of("CGPA_10","PERCENTAGE").contains(r.scoreType()) ||
                (r.scoreType().equals("CGPA_10") && r.score().compareTo(BigDecimal.TEN)>0))
                throw ApiException.badRequest("Use a valid period and a score within the selected scale.");
            if(!seen.add((r.institution().trim()+"|"+r.course().trim()+"|"+r.periodType()+"|"+r.period()).toLowerCase(Locale.ROOT)))
                throw ApiException.badRequest("This academic period is already saved.");
            Set<String> subjects=new HashSet<>();
            for(Subject subject:r.subjects()) if(!subjects.add(subject.name().trim().toLowerCase(Locale.ROOT)))
                throw ApiException.badRequest("Subjects must be distinct within a record.");
        }
        StudentProfile p=require(id); p.academics=write(records); markReviewed(p,"academics"); profiles.saveAndFlush(p); return records;
    }
    public View review(long id,String section) {
        if(!section.equals("career"))throw ApiException.badRequest("Fill in and save this section; empty sections cannot be marked complete.");
        StudentProfile p=require(id);markReviewed(p,section);profiles.saveAndFlush(p);return view(p);
    }
    private void markReviewed(StudentProfile p,String section) {
        if(!Set.of("profile","academics","interests","skills","strengths","values","career").contains(section))
            throw ApiException.badRequest("Unknown profile section.");
        List<String> reviewed=read(p.reviewedSections,new TypeReference<>(){});
        var unique=new java.util.TreeSet<>(reviewed);unique.add(section);p.reviewedSections=write(unique);
    }
    @Override public StudentSnapshot snapshot(long id) {
        View p=view(id);
        return new StudentSnapshot(p.educationLevel(),p.careerGoal().type(),p.careerGoal().text(),p.interests(),
            p.skills().stream().map(Skill::name).toList(),p.strengths(),p.values());
    }
    private String write(Object value) {
        String encoded;
        try { encoded=json.writeValueAsString(value); } catch(Exception e) { throw new IllegalStateException("Could not save section",e); }
        if(encoded.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>60000)
            throw ApiException.badRequest("This section is too large. Reduce the number or length of entries.");
        return encoded;
    }
    private <T> T read(String value,TypeReference<T> type) { try { return json.readValue(value,type); } catch(Exception e) { throw new IllegalStateException("Could not load section",e); } }
}
