package io.samved.opportunity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Imports a small, attributed set of open listings from Unstop's public endpoint. */
@Component
public class UnstopOpportunityRefresh {
    private static final Logger LOG = LoggerFactory.getLogger(UnstopOpportunityRefresh.class);
    private static final String ENDPOINT = "https://unstop.com/api/public/opportunity/search-result";
    private static final String[] CATEGORIES = {
        "jobs", "internships", "hackathons", "competitions", "quizzes", "scholarships", "workshops"
    };
    private static final int MAX_BYTES = 2_000_000;
    private final HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(8)).followRedirects(HttpClient.Redirect.NEVER).build();
    private final ObjectMapper mapper;
    private final OpportunityImporter importer;
    private final boolean enabled;
    private final int pages;
    private final int pageSize;

    public UnstopOpportunityRefresh(ObjectMapper mapper, OpportunityImporter importer,
        @Value("${samved.unstop.enabled:false}") boolean enabled,
        @Value("${samved.unstop.pages:1}") int pages,
        @Value("${samved.unstop.page-size:20}") int pageSize) {
        this.mapper = mapper;
        this.importer = importer;
        this.enabled = enabled;
        this.pages = Math.max(1, Math.min(3, pages));
        this.pageSize = Math.max(1, Math.min(50, pageSize));
    }

    /** Refreshes at most three pages per category; a failed category cannot stop the others. */
    @Scheduled(fixedDelayString = "${samved.unstop.refresh-ms:21600000}",
        initialDelayString = "${samved.unstop.initial-delay-ms:30000}")
    public void refresh() {
        if (!enabled) return;
        for (String category : CATEGORIES) {
            for (int page = 1; page <= pages; page++) {
                try {
                    List<OpportunityImporter.Draft> drafts = parse(category, fetch(category, page), Instant.now());
                    if (drafts.isEmpty()) break;
                    importer.importJson(mapper.writeValueAsBytes(drafts));
                    LOG.info("Imported {} Unstop {} listings from page {}", drafts.size(), category, page);
                    // Give the public service space between requests without hiding blocks or challenges.
                    Thread.sleep(1_000);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return;
                } catch (Exception error) {
                    LOG.warn("Unstop {} page {} refresh failed: {}", category, page, error.toString());
                    break;
                }
            }
        }
    }

    JsonNode fetch(String category, int page) throws Exception {
        String query = "opportunity=" + URLEncoder.encode(category, StandardCharsets.UTF_8)
            + "&oppstatus=open&per_page=" + pageSize + "&page=" + page;
        HttpRequest request = HttpRequest.newBuilder(URI.create(ENDPOINT + "?" + query))
            .timeout(Duration.ofSeconds(15)).header("Accept", "application/json")
            .header("User-Agent", "SAMVED/1.0 opportunity discovery").GET().build();
        HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
        try (InputStream body = response.body()) {
            if (response.statusCode() != 200) throw new IllegalStateException("Unstop returned HTTP " + response.statusCode());
            if (!response.headers().firstValue("Content-Type").orElse("").toLowerCase().contains("application/json"))
                throw new IllegalStateException("Unstop did not return JSON");
            byte[] bytes = body.readNBytes(MAX_BYTES + 1);
            if (bytes.length > MAX_BYTES) throw new IllegalStateException("Unstop response exceeded 2 MB");
            return mapper.readTree(bytes);
        }
    }

    /** Keeps only fields we can verify and link back to the source; source HTML is not republished. */
    List<OpportunityImporter.Draft> parse(String category, JsonNode response, Instant checkedAt) {
        JsonNode listings = response.path("data").path("data");
        if (!listings.isArray()) throw new IllegalArgumentException("Unstop response shape changed");
        List<OpportunityImporter.Draft> drafts = new ArrayList<>();
        for (JsonNode item : listings) {
            OpportunityImporter.Draft draft = map(category, item, checkedAt);
            if (draft != null) drafts.add(draft);
        }
        return drafts;
    }

    private OpportunityImporter.Draft map(String category, JsonNode item, Instant checkedAt) {
        if (item.path("regn_open").asInt() != 1 || !"LIVE".equalsIgnoreCase(item.path("status").asText())) return null;
        String type = Map.of("jobs", "JOB", "internships", "INTERNSHIP", "hackathons", "HACKATHON",
            "competitions", "COMPETITION", "quizzes", "QUIZ", "scholarships", "SCHOLARSHIP",
            "workshops", "WORKSHOP").get(category);
        if (type == null) return null;
        String title = item.path("title").asText("").trim();
        String organizer = item.path("organisation").path("name").asText("").trim();
        String path = item.path("public_url").asText("").trim();
        if (title.isEmpty() || title.length() > 180 || organizer.isEmpty() || organizer.length() > 120
            || !path.matches("[A-Za-z0-9/_-]+") || path.startsWith("/") || path.length() > 650) return null;
        String url = "https://unstop.com/" + path;
        JsonNode requirements = item.path("regnRequirements");
        String deadlineText = requirements.path("end_regn_dt").asText("");
        ZonedDateTime deadline = null;
        try { if (!deadlineText.isBlank()) deadline = ZonedDateTime.parse(deadlineText); }
        catch (Exception ignored) { /* Unparseable dates remain unknown; never invent a deadline. */ }
        if (deadline != null && deadline.toInstant().isBefore(checkedAt)) return null;
        List<String> skills = new ArrayList<>();
        for (JsonNode skill : item.path("required_skills")) {
            String value = skill.path("skill_name").asText("").trim();
            if (!value.isEmpty() && value.length() <= 60 && skills.size() < 8) skills.add(value);
        }
        String summary = skills.isEmpty() ? "See full details on Unstop."
            : "Skills: " + String.join(", ", skills) + ". See full details on Unstop.";
        if (summary.length() > 500) summary = summary.substring(0, 497) + "...";
        String location = item.path("region").asText("").trim();
        JsonNode places = item.path("locations");
        if (places.isArray() && !places.isEmpty()) {
            String city = places.get(0).path("city").asText("").trim();
            if (!city.isEmpty()) location = city;
        }
        if (location.length() > 100) location = location.substring(0, 100);
        String eligibility = "Check eligibility on Unstop before applying.";
        Instant closesAt = deadline == null ? null : deadline.toInstant();
        LocalDate deadlineDate = deadline == null ? null : deadline.toLocalDate();
        String zone = deadline == null ? null : deadline.getZone().getId();
        return new OpportunityImporter.Draft(type, title, organizer, summary, url, "Unstop", url,
            checkedAt, deadlineDate, closesAt, zone, location, eligibility, true);
    }
}
