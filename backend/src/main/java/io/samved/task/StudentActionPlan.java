package io.samved.task;

import jakarta.persistence.*;
import java.time.*;

@Entity @Table(name="student_action_plans")
public class StudentActionPlan {
    @Id @Column(name="student_id") public Long studentId;
    @Column(nullable=false,length=64) public String fingerprint;
    @Column(nullable=false,length=160) public String goal;
    @Column(nullable=false,length=20) public String source;
    @Column(nullable=false,length=1000) public String summary;
    @Column(name="generated_at",nullable=false) public Instant generatedAt;
    @Column(name="through_date",nullable=false) public LocalDate throughDate;
}
