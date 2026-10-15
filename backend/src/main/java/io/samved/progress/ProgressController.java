package io.samved.progress;

import io.samved.common.StudentContext;
import io.samved.roadmap.MilestoneStatus;
import io.samved.roadmap.Roadmap;
import io.samved.roadmap.RoadmapMilestoneRepository;
import io.samved.roadmap.RoadmapRepository;
import io.samved.task.LearningTaskRepository;
import io.samved.task.TaskStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/** Progress is derived from persisted records, never a separately editable number. */
@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {
    private final StudentContext context;
    private final RoadmapRepository roadmaps;
    private final RoadmapMilestoneRepository milestones;
    private final LearningTaskRepository tasks;
    public ProgressController(StudentContext context, RoadmapRepository roadmaps,
                              RoadmapMilestoneRepository milestones, LearningTaskRepository tasks) {
        this.context = context; this.roadmaps = roadmaps; this.milestones = milestones; this.tasks = tasks;
    }

    @GetMapping("/me")
    public ProgressView mine() {
        long owner = context.requireStudentId();
        List<Roadmap> plans = roadmaps.findByStudentIdOrderByCreatedAtDesc(owner);
        long totalMilestones = plans.stream().mapToLong(p -> milestones.countByRoadmapId(p.getId())).sum();
        long doneMilestones = plans.stream()
            .mapToLong(p -> milestones.countByRoadmapIdAndStatus(p.getId(), MilestoneStatus.COMPLETED)).sum();
        long totalTasks = tasks.countByStudentId(owner);
        long doneTasks = tasks.countByStudentIdAndStatus(owner, TaskStatus.COMPLETED);
        long total = totalMilestones + totalTasks;
        long done = doneMilestones + doneTasks;
        // Empty progress is explicitly zero, avoiding division by zero and misleading completion.
        int percent = total == 0 ? 0 : (int) Math.round(100.0 * done / total);
        return new ProgressView(done, total, percent, doneMilestones, totalMilestones, doneTasks, totalTasks);
    }

    public record ProgressView(long completed, long total, int percent, long completedMilestones,
                               long totalMilestones, long completedTasks, long totalTasks) {}
}
