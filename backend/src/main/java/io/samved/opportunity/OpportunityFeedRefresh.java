package io.samved.opportunity;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Polls only explicitly configured, authorized JSON feed URLs; vendor pages are never scraped. */
@Component
public class OpportunityFeedRefresh {
    private static final Logger LOG = LoggerFactory.getLogger(OpportunityFeedRefresh.class);
    private static final int MAX_BYTES = 1_000_000;
    private final OpportunityImporter importer;
    private final HttpClient client = HttpClient.newBuilder()
        .followRedirects(HttpClient.Redirect.NEVER).connectTimeout(Duration.ofSeconds(8)).build();

    public OpportunityFeedRefresh(OpportunityImporter importer) { this.importer = importer; }

    /** Feed URLs require a separate source agreement and are opt-in through server configuration. */
    @Scheduled(fixedDelayString = "${samved.opportunity.refresh-ms:21600000}",
        initialDelayString = "${samved.opportunity.initial-delay-ms:15000}")
    public void refresh() {
        String configured = System.getenv("SAMVED_OPPORTUNITY_FEED_URLS");
        if (configured == null || configured.isBlank()) return;
        List<String> urls = Arrays.stream(configured.split(",")).map(String::trim)
            .filter(value -> !value.isBlank()).distinct().limit(5).toList();
        for (String value : urls) {
            try { refreshOne(URI.create(value)); }
            catch (Exception error) { LOG.warn("Opportunity feed refresh failed for {}: {}", value, error.toString()); }
        }
    }

    void refreshOne(URI uri) throws Exception {
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
            || uri.getUserInfo() != null || uri.getFragment() != null)
            throw new IllegalArgumentException("Feed URL must be a direct HTTPS URL.");
        HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(15))
            .header("Accept", "application/json").header("User-Agent", "SAMVED/1.0 opportunity-feed")
            .GET().build();
        HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
        try (InputStream body = response.body()) {
            if (response.statusCode() != 200)
                throw new IllegalStateException("Feed returned HTTP " + response.statusCode());
            String contentType = response.headers().firstValue("Content-Type").orElse("");
            if (!contentType.toLowerCase().contains("application/json"))
                throw new IllegalStateException("Feed must return application/json.");
            byte[] bytes = body.readNBytes(MAX_BYTES + 1);
            if (bytes.length > MAX_BYTES) throw new IllegalStateException("Feed exceeds 1 MB.");
            importer.importJson(bytes);
            LOG.info("Opportunity feed refreshed from {}", uri.getHost());
        }
    }
}
