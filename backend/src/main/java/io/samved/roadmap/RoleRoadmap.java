package io.samved.roadmap;

import java.time.Instant;
import java.util.List;

/** A real roadmap.sh link or a clearly labelled AI starter plan for one stated role. */
public record RoleRoadmap(String source, String jobTitle, String summary, String url,
                          List<Milestone> milestones, String model, Instant generatedAt) {
    public record Milestone(String title, String description) {}
}
