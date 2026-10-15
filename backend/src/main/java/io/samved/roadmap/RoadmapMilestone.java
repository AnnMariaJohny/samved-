package io.samved.roadmap;

import jakarta.persistence.*;

/** Milestones are snapshots: later template edits never change an existing plan. */
@Entity
@Table(name = "roadmap_milestones", indexes = @Index(name = "idx_milestones_roadmap", columnList = "roadmap_id"))
public class RoadmapMilestone {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "roadmap_id", nullable = false)
    private long roadmapId;
    @Column(name = "position_index", nullable = false)
    private int position;
    @Column(nullable = false, length = 160)
    private String title;
    @Column(nullable = false, length = 1000)
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MilestoneStatus status;

    protected RoadmapMilestone() {}
    public RoadmapMilestone(long roadmapId, int position, String title, String description) {
        this.roadmapId = roadmapId;
        this.position = position;
        this.title = title;
        this.description = description;
        this.status = MilestoneStatus.PENDING;
    }
    public Long getId() { return id; }
    public long getRoadmapId() { return roadmapId; }
    public int getPosition() { return position; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public MilestoneStatus getStatus() { return status; }
    public void setStatus(MilestoneStatus status) { this.status = status; }
}
