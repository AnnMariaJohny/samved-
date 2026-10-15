package io.samved.roadmap;

import io.samved.common.ApiException;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/** Suggests real roadmap.sh catalogue entries from a visitor's stated topic. */
@Service
public class RoadmapDiscoveryService {
    private static final Set<String> STOP_WORDS = Set.of("a", "an", "and", "for", "i", "in", "learn",
        "me", "of", "roadmap", "the", "to", "want");
    private static final Map<String, List<String>> ALIASES = Map.of(
        "software engineer", List.of("full-stack", "frontend", "backend"),
        "web developer", List.of("frontend", "backend", "full-stack"),
        "data scientist", List.of("ai-data-scientist", "python-data-analysis"),
        "designer", List.of("ux-design", "product-design"));
    private final ParseRoadmapCatalogue catalogue;

    public RoadmapDiscoveryService(ParseRoadmapCatalogue catalogue) { this.catalogue = catalogue; }

    public List<ParseRoadmapCatalogue.RoadmapSummary> catalogue() { return catalogue.list(); }

    public List<Suggestion> suggest(String query) {
        if (query == null || query.isBlank()) throw ApiException.badRequest("Enter a roadmap topic or career goal.");
        if (query.length() > 160) throw ApiException.badRequest("Roadmap topic must be 160 characters or fewer.");
        String normalized = normalize(query);
        Set<String> terms = Arrays.stream(normalized.split(" ")).filter(term -> term.length() > 1)
            .filter(term -> !STOP_WORDS.contains(term)).collect(Collectors.toSet());
        if (terms.isEmpty()) return List.of();
        List<String> aliases = ALIASES.getOrDefault(normalized, List.of());
        return catalogue.list().stream()
            .map(item -> new Scored(item, score(item, normalized, terms, aliases)))
            .filter(item -> item.points() > 0)
            .sorted(Comparator.comparingInt(Scored::points).reversed()
                .thenComparing(item -> item.roadmap().title()))
            .limit(8).map(item -> new Suggestion(item.roadmap(), "Matches your stated topic or goal"))
            .toList();
    }

    private static int score(ParseRoadmapCatalogue.RoadmapSummary item, String query,
                             Set<String> terms, List<String> aliases) {
        String title = normalize(item.title());
        String id = normalize(item.id().replace('-', ' '));
        String description = normalize(item.description());
        int points = title.contains(query) || id.contains(query) ? 20 : 0;
        if (aliases.contains(item.id())) points += 16;
        for (String term : terms) {
            if (title.contains(term) || id.contains(term)) points += 4;
            else if (description.contains(term)) points += 1;
        }
        return points;
    }

    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    // Ranking points stay on the server; they are not a student's success probability.
    private record Scored(ParseRoadmapCatalogue.RoadmapSummary roadmap, int points) {}
    public record Suggestion(ParseRoadmapCatalogue.RoadmapSummary roadmap, String reason) {}
}
