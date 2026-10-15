package io.samved.opportunity;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class UnstopOpportunityRefreshTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final UnstopOpportunityRefresh refresh = new UnstopOpportunityRefresh(mapper, null, false, 1, 20);

    @Test
    void mapsRegistrationDeadlineAndSkillsWithoutRepublishingDetails() throws Exception {
        String json = """
            {"data":{"data":[{"id":42,"title":"Java Developer","public_url":"jobs/java-developer-42",
            "organisation":{"name":"Example Org"},"status":"LIVE","regn_open":1,
            "details":"<p>HTML content that must not appear</p>",
            "required_skills":[{"skill_name":"Java"}],"region":"online",
            "regnRequirements":{"end_regn_dt":"2026-12-01T23:59:00+05:30"}}]}}
            """;
        var result = refresh.parse("jobs", mapper.readTree(json), Instant.parse("2026-10-14T00:00:00Z"));
        assertThat(result).hasSize(1);
        var job = result.get(0);
        assertThat(job.type()).isEqualTo("JOB");
        assertThat(job.applicationUrl()).isEqualTo("https://unstop.com/jobs/java-developer-42");
        assertThat(job.closesAt()).isEqualTo(Instant.parse("2026-12-01T18:29:00Z"));
        assertThat(job.summary()).contains("Java").doesNotContain("HTML content");
    }

    @Test
    void skipsClosedOrUnsafeRecordsAndKeepsUnknownDeadlineUnknown() throws Exception {
        String json = """
            {"data":{"data":[
            {"title":"Closed","public_url":"jobs/closed","organisation":{"name":"Org"},"status":"LIVE","regn_open":0},
            {"title":"Unsafe","public_url":"https://elsewhere.example/evil","organisation":{"name":"Org"},"status":"LIVE","regn_open":1},
            {"title":"Open","public_url":"competitions/open-10","organisation":{"name":"Org"},"status":"LIVE","regn_open":1}
            ]}}
            """;
        var result = refresh.parse("competitions", mapper.readTree(json), Instant.now());
        assertThat(result).hasSize(1);
        assertThat(result.get(0).deadline()).isNull();
        assertThat(result.get(0).type()).isEqualTo("COMPETITION");
    }
}
