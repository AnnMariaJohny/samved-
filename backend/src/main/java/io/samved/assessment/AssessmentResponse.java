package io.samved.assessment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "assessment_responses",
        uniqueConstraints = @UniqueConstraint(name = "uq_assessment_student_version_question",
                columnNames = {"student_id", "question_version", "question_id"}),
        indexes = @Index(name = "idx_assessment_student_version", columnList = "student_id,question_version"))
class AssessmentResponse {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "student_id", nullable = false)
    private long studentId;
    @Column(name = "question_version", nullable = false)
    private int questionVersion;
    @Column(name = "question_id", nullable = false, length = 60)
    private String questionId;
    @Column(name = "option_id", nullable = false, length = 60)
    private String optionId;
    @Column(name = "answered_at", nullable = false)
    private Instant answeredAt;

    protected AssessmentResponse() {}

    AssessmentResponse(long studentId, int questionVersion, String questionId, String optionId, Instant answeredAt) {
        this.studentId = studentId;
        this.questionVersion = questionVersion;
        this.questionId = questionId;
        this.optionId = optionId;
        this.answeredAt = answeredAt;
    }

    String questionId() { return questionId; }
    String optionId() { return optionId; }
}
