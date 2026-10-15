package io.samved.roadmap;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

/** Opt-in live check with a synthetic role title; never sends student profile data. */
class NimRoadmapLiveTest {
    @Test
    void generatesStarterMilestones() {
        Assumptions.assumeTrue("true".equals(System.getenv("SAMVED_NIM_ROADMAP_LIVE_TEST")));
        String key = System.getenv("SAMVED_NVIDIA_API_KEY");
        Assumptions.assumeTrue(key != null && !key.isBlank());
        RoleRoadmap result = new NimRoadmapGenerator(key, "openai/gpt-oss-20b", new ObjectMapper())
            .generate("Museum Curator");
        assertThat(result.milestones()).hasSize(5);
        System.out.println("AI roadmap: " + result.jobTitle() + " | " + result.source());
        result.milestones().forEach(step -> System.out.println("- " + step.title()));
    }
}
