package io.samved.roadmap;

import jakarta.persistence.*;
import java.time.Instant;

/** A generated plan belongs to exactly one signed-in student. */
@Entity
@Table(name = "roadmaps",
    indexes = @Index(name = "idx_roadmaps_student", columnList = "student_id"),
    uniqueConstraints = @UniqueConstraint(name = "uq_roadmap_student_template", columnNames = {"student_id", "template_code"}))
public class Roadmap {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "student_id", nullable = false)
    private long studentId;
    @Column(name = "template_code", nullable = false, length = 40)
    private String templateCode;
    @Column(name = "goal", nullable = false, length = 160)
    private String goal;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Roadmap() {}
    public Roadmap(long studentId, String templateCode, String goal) {
        this.studentId = studentId;
        this.templateCode = templateCode;
        this.goal = goal;
        this.createdAt = Instant.now();
    }
    public Long getId() { return id; }
    public long getStudentId() { return studentId; }
    public String getTemplateCode() { return templateCode; }
    public String getGoal() { return goal; }
    public Instant getCreatedAt() { return createdAt; }
}
