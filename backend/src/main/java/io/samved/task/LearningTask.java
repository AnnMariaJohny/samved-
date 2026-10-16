package io.samved.task;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "learning_tasks", indexes = @Index(name = "idx_tasks_student", columnList = "student_id"))
public class LearningTask {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "student_id", nullable = false)
    private long studentId;
    @Column(name = "roadmap_id")
    private Long roadmapId;
    @Column(name = "milestone_id")
    private Long milestoneId;
    @Column(nullable = false, length = 160)
    private String title;
    @Column(length = 1000)
    private String description;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name="auto_plan_key",length=64) private String autoPlanKey;

    protected LearningTask() {}
    public LearningTask(long studentId, Long roadmapId, Long milestoneId, String title,
                        String description, LocalDate dueDate) {
        this.studentId = studentId;
        this.roadmapId = roadmapId;
        this.milestoneId = milestoneId;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.status = TaskStatus.PENDING;
        this.createdAt = Instant.now();
    }
    public Long getId() { return id; }
    public long getStudentId() { return studentId; }
    public Long getRoadmapId() { return roadmapId; }
    public Long getMilestoneId() { return milestoneId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public LocalDate getDueDate() { return dueDate; }
    public TaskStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public String getAutoPlanKey() { return autoPlanKey; }
    public void setAutoPlanKey(String key) { autoPlanKey=key; }
    public void update(String title, String description, LocalDate dueDate) {
        this.autoPlanKey = null; // A student-edited assignment is preserved on future replanning.
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
    }
    public void setStatus(TaskStatus status) { this.status = status; }
}
