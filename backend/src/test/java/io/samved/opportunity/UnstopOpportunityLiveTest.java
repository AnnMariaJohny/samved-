package io.samved.opportunity;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/** Run deliberately when checking the public endpoint; ordinary test runs stay offline. */
class UnstopOpportunityLiveTest {
    @Test
    @EnabledIfEnvironmentVariable(named = "SAMVED_UNSTOP_LIVE_TEST", matches = "true")
    void publicEndpointSuppliesUsableJobRecords() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        var refresh = new UnstopOpportunityRefresh(mapper, null, false, 1, 2);
        var records = refresh.parse("jobs", refresh.fetch("jobs", 1), Instant.now());
        assertThat(records).isNotEmpty();
        assertThat(records.get(0).sourceUrl()).startsWith("https://unstop.com/");
    }
}
