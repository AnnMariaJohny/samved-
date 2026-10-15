package io.samved.roadmap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.common.ApiException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Reads the roadmap.sh catalogue through the user's Parse API without exposing its key to browsers. */
@Service
public class ParseRoadmapCatalogue {
    private static final URI LIST_API = URI.create(
        "https://api.parse.bot/scraper/b661d12c-4091-495b-bda8-db302f933df4/list_roadmaps");
    // Beginner paths use a roadmap.sh selector query such as /frontend?r=frontend-beginner.
    private static final Pattern SAFE_PATH = Pattern.compile(
        "/[a-z0-9][a-z0-9/-]{0,100}(\\?r=[a-z0-9-]{1,100})?");
    private static final int MAX_BYTES = 1_000_000;
    private final String apiKey;
    private final URI endpoint;
    private final HttpClient http;
    private final ObjectMapper json;
    private final RoadmapCatalogueRepository repository;
    private List<RoadmapSummary> cached = List.of();

    @Autowired
    public ParseRoadmapCatalogue(@Value("${PARSE_API_KEY:}") String apiKey, ObjectMapper json,
                                  RoadmapCatalogueRepository repository) {
        this(apiKey, LIST_API, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build(), json,
            repository);
    }

    // A direct constructor is used by the deliberate opt-in live smoke test.
    ParseRoadmapCatalogue(String apiKey, ObjectMapper json) {
        this(apiKey, LIST_API, HttpClient.newHttpClient(), json, null);
    }

    // A local endpoint makes the parser and cache testable without consuming Parse credits.
    ParseRoadmapCatalogue(String apiKey, URI endpoint, HttpClient http, ObjectMapper json) {
        this(apiKey, endpoint, http, json, null);
    }

    ParseRoadmapCatalogue(String apiKey, URI endpoint, HttpClient http, ObjectMapper json,
                           RoadmapCatalogueRepository repository) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.endpoint = endpoint;
        this.http = http;
        this.json = json;
        this.repository = repository;
    }

    public synchronized List<RoadmapSummary> list() {
        if (!cached.isEmpty()) return cached;
        // A saved catalogue is usable after restart, even when the Parse key has been removed.
        if (repository != null) {
            List<RoadmapCatalogueEntry> saved = repository.findAllByOrderBySortOrderAsc();
            if (!saved.isEmpty()) {
                try {
                    cached = saved.stream().map(this::restore).toList();
                    return cached;
                } catch (Exception error) {
                    throw ApiException.serviceUnavailable("Saved roadmap catalogue could not be read.");
                }
            }
        }
        if (apiKey.isBlank()) throw ApiException.serviceUnavailable("Roadmap catalogue is not configured.");
        try {
            List<RoadmapSummary> fresh = fetch();
            if (fresh.isEmpty()) throw new IllegalArgumentException("Empty roadmap catalogue");
            if (repository != null) {
                List<RoadmapCatalogueEntry> entries = new ArrayList<>();
                for (int i = 0; i < fresh.size(); i++) {
                    RoadmapSummary item = fresh.get(i);
                    entries.add(new RoadmapCatalogueEntry(item, i, json.writeValueAsString(item.tags())));
                }
                repository.saveAll(entries);
            }
            cached = List.copyOf(fresh);
            return cached;
        } catch (Exception error) {
            // Keep showing a previously fetched catalogue during a temporary upstream failure.
            if (!cached.isEmpty()) return cached;
            throw ApiException.serviceUnavailable("Roadmap catalogue is temporarily unavailable.");
        }
    }

    private RoadmapSummary restore(RoadmapCatalogueEntry row) {
        try {
            String[] tags = json.readValue(row.getTagsJson(), String[].class);
            return new RoadmapSummary(row.getId(), row.getTitle(), row.getDescription(), row.getUrl(),
                List.of(tags), row.getUpdatedAt());
        } catch (Exception error) {
            throw new IllegalArgumentException("Invalid saved catalogue tags", error);
        }
    }

    private List<RoadmapSummary> fetch() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(endpoint).timeout(Duration.ofSeconds(30))
            .header("X-API-Key", apiKey).header("Accept", "application/json").GET().build();
        HttpResponse<InputStream> response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
        try (InputStream stream = response.body()) {
            if (response.statusCode() != 200) throw new IllegalStateException("Parse returned HTTP error");
            byte[] bytes = stream.readNBytes(MAX_BYTES + 1);
            if (bytes.length > MAX_BYTES) throw new IllegalArgumentException("Roadmap catalogue is too large");
            JsonNode root = json.readTree(bytes);
            // The live list_roadmaps endpoint returns {status,data:{roadmaps:[...]}}.
            if (!"success".equals(root.path("status").asText()) ||
                !root.path("data").path("roadmaps").isArray())
                throw new IllegalArgumentException("Unexpected Parse roadmap response");
            List<RoadmapSummary> result = new ArrayList<>();
            for (JsonNode item : root.path("data").path("roadmaps")) {
                if (result.size() >= 200) break;
                String id = item.path("id").asText("");
                String path = item.path("url").asText("");
                String title = item.path("title").asText("");
                if (!SAFE_PATH.matcher(path).matches() || !id.matches("[a-z0-9-]{1,100}") ||
                    title.isBlank() || title.length() > 160) continue;
                List<String> tags = new ArrayList<>();
                for (JsonNode tag : item.path("metadata").path("tags")) {
                    if (tag.isTextual() && tag.asText().matches("[\\p{L}\\p{N} .+#/_-]{1,60}")
                        && tags.size() < 10) tags.add(tag.asText());
                }
                String description = item.path("description").asText("")
                    .replace("@currentYear@", Integer.toString(Year.now().getValue()));
                if (description.length() > 500) description = description.substring(0, 500);
                String updatedAt = item.path("updatedAt").asText("");
                if (updatedAt.length() > 80) updatedAt = "";
                result.add(new RoadmapSummary(id, title, description, "https://roadmap.sh" + path,
                    List.copyOf(tags), updatedAt));
            }
            return result;
        }
    }

    public record RoadmapSummary(String id, String title, String description, String url,
                                 List<String> tags, String updatedAt) {}
}
