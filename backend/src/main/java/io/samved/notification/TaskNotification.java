package io.samved.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.time.LocalDate;

/** A persisted in-app reminder owned by one student. */
@Entity
@Table(name = "task_notifications",
    indexes = @Index(name = "idx_notifications_student", columnList = "student_id,created_at"),
    uniqueConstraints = @UniqueConstraint(name = "uq_task_notification", columnNames = {"task_id", "due_date", "kind"}))
public class TaskNotification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "student_id", nullable = false)
    private long studentId;
    @Column(name = "task_id", nullable = false)
    private long taskId;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Kind kind;
    @Column(nullable = false, length = 240)
    private String message;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "read_at")
    private Instant readAt;

    protected TaskNotification() {}
    public TaskNotification(long studentId, long taskId, LocalDate dueDate, Kind kind, String message) {
        this.studentId = studentId;
        this.taskId = taskId;
        this.dueDate = dueDate;
        this.kind = kind;
        this.message = message;
        this.createdAt = Instant.now();
    }
    public Long getId() { return id; }
    public long getStudentId() { return studentId; }
    public long getTaskId() { return taskId; }
    public LocalDate getDueDate() { return dueDate; }
    public Kind getKind() { return kind; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReadAt() { return readAt; }
    public void markRead() { if (readAt == null) readAt = Instant.now(); }
    public enum Kind { DUE_TOMORROW, DUE_TODAY, OVERDUE }
}
