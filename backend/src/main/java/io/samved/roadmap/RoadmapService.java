package io.samved.roadmap;

import io.samved.common.ApiException;
import io.samved.common.StudentContext;
import io.samved.common.StudentProfilePort;
import io.samved.common.StudentSnapshot;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

/** Generates original plans and links to related roadmap.sh pages without copying their content. */
@Service
public class RoadmapService {
    private static final Map<String, List<Step>> TEMPLATES = Map.of(
        "SOFTWARE", List.of(
            new Step("Choose a direction", "Pick one software role and note what interests you about it."),
            new Step("Learn the foundations", "Practice programming, version control and problem solving with small exercises."),
            new Step("Build evidence", "Create one project, document your decisions and ask someone for feedback.")),
        "DESIGN", List.of(
            new Step("Study user needs", "Interview potential users and write down the problem in their words."),
            new Step("Prototype a solution", "Sketch an accessible flow and test it with a few users."),
            new Step("Build a portfolio case", "Explain your research, revisions and final design choices.")),
        "DATA", List.of(
            new Step("Build a data foundation", "Practise statistics, spreadsheets and responsible data handling."),
            new Step("Analyse a public dataset", "Clean one dataset, explain your method and check your conclusions."),
            new Step("Share a decision brief", "Create a chart and a short report for a nontechnical reader.")),
        "RESEARCH", List.of(
            new Step("Choose a question", "Read credible research and write a narrow question you can investigate."),
            new Step("Design a small study", "Plan ethical data collection and ask a qualified mentor for feedback."),
            new Step("Present evidence", "Explain findings, limits and next questions in a short report.")),
        "MEDICINE", List.of(
            new Step("Check local entry rules", "Review current accredited medical programme requirements in your region."),
            new Step("Build science foundations", "Strengthen biology, chemistry and communication with supervised guidance."),
            new Step("Explore care responsibly", "Speak with trained professionals about patient care and required licensing.")),
        "TEACHING", List.of(
            new Step("Choose learners and subject", "Identify an age group and subject you would like to teach."),
            new Step("Practise explaining", "Prepare a short lesson and collect feedback from a teacher or mentor."),
            new Step("Check qualifications", "Review current accredited teacher training rules for your location.")),
        "ENTREPRENEURSHIP", List.of(
            new Step("Find a real problem", "Interview potential users and record their current workarounds."),
            new Step("Test a small idea", "Build a simple prototype and ask users what works and what does not."),
            new Step("Plan responsible delivery", "Estimate costs, risks and the next experiment before taking money.")),
        "CIVIL_ENGINEERING", List.of(
            new Step("Check engineering pathways", "Review accredited civil engineering study options and local requirements."),
            new Step("Build core skills", "Practise mathematics, design reasoning and safety-focused problem solving."),
            new Step("Make a small portfolio", "Document a supervised infrastructure or design exercise and its constraints.")),
        "EXPLORING", List.of(
            new Step("Explore options", "Compare three career paths, including their daily work and education requirements."),
            new Step("Try a small activity", "Complete one short exercise or conversation for each promising path."),
            new Step("Reflect and choose", "Record what you enjoyed, what was difficult and your next question."))
    );
    // roadmap.sh permits sharing links, but its content cannot be redistributed.
    // Only verified public URLs for closely related development paths are listed here.
    private static final Map<String, List<ExternalResource>> EXTERNAL_RESOURCES = Map.of(
        "SOFTWARE", List.of(
            new ExternalResource("roadmap.sh", "Frontend Developer", "https://roadmap.sh/frontend"),
            new ExternalResource("roadmap.sh", "Backend Developer", "https://roadmap.sh/backend"),
            new ExternalResource("roadmap.sh", "Full Stack Developer", "https://roadmap.sh/full-stack")),
        "DATA", List.of(
            new ExternalResource("roadmap.sh", "Data Analyst", "https://roadmap.sh/data-analyst"),
            new ExternalResource("roadmap.sh", "AI and Data Scientist", "https://roadmap.sh/ai-data-scientist")),
        "DESIGN", List.of(new ExternalResource("roadmap.sh", "UX Design", "https://roadmap.sh/ux-design"))
    );
    private final RoadmapRepository roadmaps;
    private final RoadmapMilestoneRepository milestones;
    private final StudentContext studentContext;
    private final StudentProfilePort profiles;

    public RoadmapService(RoadmapRepository roadmaps, RoadmapMilestoneRepository milestones,
                          StudentContext studentContext, StudentProfilePort profiles) {
        this.roadmaps = roadmaps;
        this.milestones = milestones;
        this.studentContext = studentContext;
        this.profiles = profiles;
    }

    public List<RoadmapView> mine() {
        long studentId = studentContext.requireStudentId();
        return roadmaps.findByStudentIdOrderByCreatedAtDesc(studentId).stream().map(this::view).toList();
    }

    /** The server, not a request body, supplies ownership. */
    @Transactional
    public RoadmapView create(CreateRoadmap request) {
        if (request == null) throw ApiException.badRequest("Roadmap details are required");
        long studentId = studentContext.requireStudentId();
        String template = request.templateCode() == null ? "EXPLORING" : request.templateCode().trim().toUpperCase();
        List<Step> steps = TEMPLATES.get(template);
        if (steps == null) throw ApiException.badRequest("Unknown roadmap template");
        // Repeating the same create request returns the existing plan instead of duplicating progress.
        Roadmap existing = roadmaps.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
            .filter(plan -> plan.getTemplateCode().equals(template)).findFirst().orElse(null);
        if (existing != null) return view(existing);
        String requestedGoal = request.goal() == null ? "" : request.goal().trim();
        // Read Christa's profile only when the browser did not provide a goal label.
        String storedGoal = requestedGoal.isEmpty() ? defaultGoal(profiles.snapshot(studentId)) : requestedGoal;
        if (storedGoal.length() > 160) throw ApiException.badRequest("Goal must be 160 characters or fewer");
        Roadmap roadmap = roadmaps.save(new Roadmap(studentId, template, storedGoal));
        for (int i = 0; i < steps.size(); i++) {
            Step step = steps.get(i);
            milestones.save(new RoadmapMilestone(roadmap.getId(), i + 1, step.title(), step.description()));
        }
        return view(roadmap);
    }

    /** A missing or foreign ID has the same 404 response to avoid disclosing another student's plan. */
    @Transactional
    public MilestoneView updateMilestone(long id, MilestoneStatus status) {
        if (status == null) throw ApiException.badRequest("Status is required");
        long studentId = studentContext.requireStudentId();
        RoadmapMilestone milestone = milestones.findById(id).orElseThrow(() -> ApiException.notFound("Milestone not found"));
        roadmaps.findByIdAndStudentId(milestone.getRoadmapId(), studentId)
            .orElseThrow(() -> ApiException.notFound("Milestone not found"));
        milestone.setStatus(status);
        return new MilestoneView(milestone.getId(), milestone.getPosition(), milestone.getTitle(),
            milestone.getDescription(), milestone.getStatus());
    }

    public Roadmap getOwned(long id, long studentId) {
        return roadmaps.findByIdAndStudentId(id, studentId).orElseThrow(() -> ApiException.notFound("Roadmap not found"));
    }

    private RoadmapView view(Roadmap roadmap) {
        List<MilestoneView> stages = milestones.findByRoadmapIdOrderByPositionAsc(roadmap.getId()).stream()
            .map(m -> new MilestoneView(m.getId(), m.getPosition(), m.getTitle(), m.getDescription(), m.getStatus()))
            .toList();
        // The links are read-time metadata, so existing saved roadmaps gain them without a migration.
        return new RoadmapView(roadmap.getId(), roadmap.getTemplateCode(), roadmap.getGoal(), roadmap.getCreatedAt(),
            stages, EXTERNAL_RESOURCES.getOrDefault(roadmap.getTemplateCode(), List.of()));
    }

    private String defaultGoal(StudentSnapshot snapshot) {
        String goal = snapshot.goalText();
        return goal == null || goal.isBlank() ? "Explore career paths" : goal.trim();
    }

    private record Step(String title, String description) {}
    public record CreateRoadmap(String templateCode, String goal) {}
    public record MilestoneView(long id, int position, String title, String description, MilestoneStatus status) {}
    public record ExternalResource(String source, String title, String url) {}
    public record RoadmapView(long id, String templateCode, String goal, java.time.Instant createdAt,
                              List<MilestoneView> milestones, List<ExternalResource> externalResources) {}
}
