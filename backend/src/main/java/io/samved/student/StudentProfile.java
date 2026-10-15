package io.samved.student;

import io.samved.auth.Account;
import jakarta.persistence.*;

/** Bounded section documents are replaced atomically and never accepted as owner IDs. */
@Entity
@Table(name = "student_profiles")
public class StudentProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @OneToOne(optional = false) @JoinColumn(name = "user_id", nullable = false, unique = true) public Account account;
    @Version public long version;
    @Column(nullable = false, length = 100) public String name;
    @Column(name = "education_level", nullable = false, length = 30) public String educationLevel;
    @Column(name = "city_region", nullable = false, length = 100) public String cityRegion = "";
    @Column(name = "goal_type", nullable = false, length = 20) public String goalType = "EXPLORING";
    @Column(name = "goal_text", length = 160) public String goalText;
    @Column(nullable = false, columnDefinition = "TEXT") public String interests = "[]";
    @Column(nullable = false, columnDefinition = "TEXT") public String skills = "[]";
    @Column(nullable = false, columnDefinition = "TEXT") public String strengths = "[]";
    @Column(nullable = false, columnDefinition = "TEXT") public String valuesJson = "[]";
    @Column(nullable = false, columnDefinition = "TEXT") public String academics = "[]";
    @Column(name = "reviewed_sections", nullable = false, length = 500) public String reviewedSections = "[]";
    @Column(name = "roadmap_preferences", nullable = false, length = 4000) public String roadmapPreferences = "{\"savedSlugs\":[],\"activeSlug\":null}";
    public StudentProfile() { }
}
