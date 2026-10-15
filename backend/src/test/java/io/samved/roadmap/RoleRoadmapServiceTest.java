package io.samved.roadmap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;

class RoleRoadmapServiceTest {
    private final ParseRoadmapCatalogue catalogue = mock(ParseRoadmapCatalogue.class);
    private final NimRoadmapGenerator generator = mock(NimRoadmapGenerator.class);
    private final RoleRoadmapService service = new RoleRoadmapService(catalogue, generator);

    @Test
    void exactTitleUsesRealRoadmapWithoutCallingAi() {
        when(catalogue.list()).thenReturn(List.of(new ParseRoadmapCatalogue.RoadmapSummary(
            "data-analyst", "Data Analyst", "Learn data analysis", "https://roadmap.sh/data-analyst",
            List.of(), "")));
        RoleRoadmap result = service.forRole("Data Analyst");
        assertThat(result.source()).isEqualTo("ROADMAP_SH");
        assertThat(result.url()).isEqualTo("https://roadmap.sh/data-analyst");
        assertThat(result.milestones()).isEmpty();
        verify(generator, never()).generate("Data Analyst");
    }

    @Test
    void missingTitleUsesAiButRejectsContactDetails() {
        when(catalogue.list()).thenReturn(List.of());
        var aiPlan = new RoleRoadmap("AI_GENERATED", "Museum Curator", "Starter plan", null,
            List.of(), "openai/gpt-oss-20b", java.time.Instant.now());
        when(generator.generate("Museum Curator")).thenReturn(aiPlan);
        assertThat(service.forRole("Museum Curator")).isEqualTo(aiPlan);
        assertThatThrownBy(() -> service.forRole("me@example.com")).hasMessageContaining("job title");
        verify(generator).generate("Museum Curator");
    }
}
