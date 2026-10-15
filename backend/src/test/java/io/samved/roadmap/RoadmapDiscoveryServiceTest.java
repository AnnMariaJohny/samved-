package io.samved.roadmap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;

class RoadmapDiscoveryServiceTest {
    @Test
    void recommendsOnlyRealCatalogueItemsForStatedGoal() {
        ParseRoadmapCatalogue catalogue = mock(ParseRoadmapCatalogue.class);
        var frontend = new ParseRoadmapCatalogue.RoadmapSummary("frontend", "Frontend", "Learn web UI",
            "https://roadmap.sh/frontend", List.of(), "2026-09-01T00:00:00Z");
        var backend = new ParseRoadmapCatalogue.RoadmapSummary("backend", "Backend", "Learn APIs",
            "https://roadmap.sh/backend", List.of(), "2026-09-01T00:00:00Z");
        var medicine = new ParseRoadmapCatalogue.RoadmapSummary("medicine", "Medicine", "Learn care",
            "https://roadmap.sh/medicine", List.of(), "2026-09-01T00:00:00Z");
        when(catalogue.list()).thenReturn(List.of(frontend, backend, medicine));

        List<RoadmapDiscoveryService.Suggestion> suggestions =
            new RoadmapDiscoveryService(catalogue).suggest("software engineer");

        assertThat(suggestions).extracting(item -> item.roadmap().id())
            .containsExactlyInAnyOrder("frontend", "backend");
    }
}
