package io.samved.roadmap;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoadmapCatalogueRepository extends JpaRepository<RoadmapCatalogueEntry, String> {
    List<RoadmapCatalogueEntry> findAllByOrderBySortOrderAsc();
}
