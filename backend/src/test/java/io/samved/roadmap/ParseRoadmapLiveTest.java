package io.samved.roadmap;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

/** Opt-in smoke test: run only when explicitly asked to spend a Parse API call. */
class ParseRoadmapLiveTest {
    @Test
    void printsRealCatalogueSample() {
        Assumptions.assumeTrue("true".equals(System.getenv("SAMVED_PARSE_LIVE_TEST")));
        String key = System.getenv("PARSE_API_KEY");
        Assumptions.assumeTrue(key != null && !key.isBlank());
        var roadmaps = new ParseRoadmapCatalogue(key, new ObjectMapper()).list();
        assertThat(roadmaps).isNotEmpty();
        System.out.println("Parse roadmap.sh catalogue: " + roadmaps.size() + " entries");
        roadmaps.stream().limit(5).forEach(item ->
            System.out.println(item.id() + " | " + item.title() + " | " + item.url()));
    }
}
