package io.samved.task;

import io.samved.common.ApiException;
import io.samved.common.StudentContext;
import io.samved.notification.TaskNotificationService;
import io.samved.roadmap.RoadmapMilestone;
import io.samved.roadmap.RoadmapMilestoneRepository;
import io.samved.roadmap.RoadmapService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class LearningTaskService {
    private final LearningTaskRepository tasks;
    private final RoadmapMilestoneRepository milestones;
    private final RoadmapService roadmaps;
    private final StudentContext context;
    private final TaskNotificationService notifications;
    public LearningTaskService(LearningTaskRepository tasks, RoadmapMilestoneRepository milestones,
                               RoadmapService roadmaps, StudentContext context, TaskNotificationService notifications) {
        this.tasks = tasks; this.milestones = milestones; this.roadmaps = roadmaps;
        this.context = context; this.notifications = notifications;
    }

    public List<TaskView> mine() {
        return tasks.findByStudentIdOrderByCreatedAtDesc(context.requireStudentId()).stream().map(this::view).toList();
    }

    @Transactional
    public TaskView create(TaskInput input) {
        long owner = context.requireStudentId();
        validate(input);
        validateLinks(owner, input.roadmapId(), input.milestoneId());
        // The owner ID always comes from the server-side session.
        return view(tasks.save(new LearningTask(owner, input.roadmapId(), input.milestoneId(),
            input.title().trim(), clean(input.description()), input.dueDate())));
    }

    @Transactional
    public TaskView update(long id, TaskInput input) {
        LearningTask task = owned(id);
        validate(input);
        if (!java.util.Objects.equals(task.getRoadmapId(), input.roadmapId()) ||
            !java.util.Objects.equals(task.getMilestoneId(), input.milestoneId()))
            throw ApiException.badRequest("Task roadmap and milestone cannot be changed");
        // Remove reminders for the previous title/date before updating the task.
        notifications.clearForTask(task);
        task.update(input.title().trim(), clean(input.description()), input.dueDate());
        return view(task);
    }

    @Transactional
    public TaskView changeStatus(long id, TaskStatus status) {
        if (status == null) throw ApiException.badRequest("Status is required");
        LearningTask task = owned(id);
        if (status == TaskStatus.COMPLETED) notifications.clearForTask(task);
        task.setStatus(status);
        return view(task);
    }

    @Transactional
    public void delete(long id) {
        LearningTask task = owned(id);
        notifications.clearForTask(task);
        tasks.delete(task);
    }

    private LearningTask owned(long id) {
        return tasks.findByIdAndStudentId(id, context.requireStudentId())
            .orElseThrow(() -> ApiException.notFound("Task not found"));
    }

    private void validate(TaskInput input) {
        if (input == null || input.title() == null || input.title().isBlank() || input.title().trim().length() > 160)
            throw ApiException.badRequest("Task title must have 1 to 160 characters");
        if (input.description() != null && input.description().length() > 1000)
            throw ApiException.badRequest("Task description must have at most 1000 characters");
    }

    private void validateLinks(long owner, Long roadmapId, Long milestoneId) {
        if (milestoneId != null && roadmapId == null) throw ApiException.badRequest("Milestone requires a roadmap");
        if (roadmapId == null) return;
        roadmaps.getOwned(roadmapId, owner);
        if (milestoneId != null) {
            RoadmapMilestone milestone = milestones.findById(milestoneId)
                .orElseThrow(() -> ApiException.notFound("Milestone not found"));
            if (milestone.getRoadmapId() != roadmapId) throw ApiException.notFound("Milestone not found");
        }
    }

    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private TaskView view(LearningTask task) {
        return new TaskView(task.getId(), task.getRoadmapId(), task.getMilestoneId(), task.getTitle(),
            task.getDescription(), task.getDueDate(), task.getStatus(), task.getCreatedAt());
    }
    public record TaskInput(Long roadmapId, Long milestoneId, String title, String description, LocalDate dueDate) {}
    public record TaskView(long id, Long roadmapId, Long milestoneId, String title, String description,
                           LocalDate dueDate, TaskStatus status, java.time.Instant createdAt) {}
}
