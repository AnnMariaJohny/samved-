package io.samved.opportunity;

import static org.assertj.core.api.Assertions.assertThat;

import io.samved.common.StudentSnapshot;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class OpportunityMatcherTest {
    @Test
    void relevantTitleWinsAndShortSignalsDoNotMatchInsideOtherWords() {
        Opportunity ai = listing("AI design hackathon", "Build accessible products");
        Opportunity unrelated = listing("General event", "Leadership training");
        StudentSnapshot student = new StudentSnapshot("UNDERGRADUATE", "EXPLORING", null,
            List.of("AI", "design"), List.of("Java"), List.of(), List.of());

        OpportunityMatcher.Match relevant = OpportunityMatcher.match(ai, student);
        OpportunityMatcher.Match other = OpportunityMatcher.match(unrelated, student);

        assertThat(relevant.score()).isEqualTo(8);
        assertThat(relevant.matchedSignals()).containsExactly("AI", "design");
        assertThat(other.score()).isZero();
    }

    private Opportunity listing(String title, String summary) {
        return new Opportunity("HACKATHON", title, "Organizer", summary,
            "https://example.org/apply", "Example", "https://example.org/event",
            Instant.now(), null, null, null, "Online", null, true);
    }
}
