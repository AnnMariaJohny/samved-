package io.samved.opportunity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/** An attributed listing checked through a reviewed import or supported source refresh. */
@Entity
@Table(name = "opportunities", indexes = {
    @Index(name = "idx_opportunities_deadline", columnList = "deadline"),
    @Index(name = "idx_opportunities_type", columnList = "type")
})
public class Opportunity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 40)
    private String type;
    @Column(nullable = false, length = 180)
    private String title;
    @Column(nullable = false, length = 120)
    private String organizer;
    @Column(nullable = false, length = 500)
    private String summary;
    @Column(name = "application_url", nullable = false, length = 1000)
    private String applicationUrl;
    @Column(name = "source_name", nullable = false, length = 100)
    private String sourceName;
    @Column(name = "source_url", nullable = false, length = 700, unique = true)
    private String sourceUrl;
    @Column(name = "verified_at", nullable = false)
    private Instant verifiedAt;
    @Column(name = "deadline")
    private LocalDate deadline;
    @Column(name = "closes_at")
    private Instant closesAt;
    @Column(name = "deadline_zone", length = 60)
    private String deadlineZone;
    @Column(length = 100)
    private String location;
    @Column(length = 1000)
    private String eligibility;
    @Column(nullable = false)
    private boolean published;

    protected Opportunity() {}
    /** Stores bounded listing facts and a short SAMVED summary. */
    public Opportunity(String type, String title, String organizer, String summary, String applicationUrl,
                       String sourceName, String sourceUrl, Instant verifiedAt, LocalDate deadline,
                       Instant closesAt, String deadlineZone, String location, String eligibility, boolean published) {
        this.type = type;
        this.title = title;
        this.organizer = organizer;
        this.summary = summary;
        this.applicationUrl = applicationUrl;
        this.sourceName = sourceName;
        this.sourceUrl = sourceUrl;
        this.verifiedAt = verifiedAt;
        this.deadline = deadline;
        this.closesAt = closesAt;
        this.deadlineZone = deadlineZone;
        this.location = location;
        this.eligibility = eligibility;
        this.published = published;
    }

    public void revise(String type, String title, String organizer, String summary, String applicationUrl,
                       String sourceName, Instant verifiedAt, LocalDate deadline, String location,
                       Instant closesAt, String deadlineZone, String eligibility, boolean published) {
        this.type = type;
        this.title = title;
        this.organizer = organizer;
        this.summary = summary;
        this.applicationUrl = applicationUrl;
        this.sourceName = sourceName;
        this.verifiedAt = verifiedAt;
        this.deadline = deadline;
        this.closesAt = closesAt;
        this.deadlineZone = deadlineZone;
        this.location = location;
        this.eligibility = eligibility;
        this.published = published;
    }
    public Long getId() { return id; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getOrganizer() { return organizer; }
    public String getSummary() { return summary; }
    public String getApplicationUrl() { return applicationUrl; }
    public String getSourceName() { return sourceName; }
    public String getSourceUrl() { return sourceUrl; }
    public Instant getVerifiedAt() { return verifiedAt; }
    public LocalDate getDeadline() { return deadline; }
    public Instant getClosesAt() { return closesAt; }
    public String getDeadlineZone() { return deadlineZone; }
    public String getLocation() { return location; }
    public String getEligibility() { return eligibility; }
    public boolean isPublished() { return published; }
}
