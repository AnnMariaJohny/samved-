package io.samved.roadmap;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoadmapMilestoneRepository extends JpaRepository<RoadmapMilestone, Long> {
    List<RoadmapMilestone> findByRoadmapIdOrderByPositionAsc(long roadmapId);
    long countByRoadmapId(long roadmapId);
    long countByRoadmapIdAndStatus(long roadmapId, MilestoneStatus status);
}
