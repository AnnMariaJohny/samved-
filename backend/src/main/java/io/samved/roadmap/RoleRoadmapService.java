package io.samved.roadmap;

import io.samved.common.ApiException;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/** Uses the real catalogue first and asks AI only when no exact role roadmap exists. */
@Service
public class RoleRoadmapService {
    private static final Pattern ROLE = Pattern.compile("[\\p{L}][\\p{L}\\p{N} .,&+/#()'-]{2,79}");
    private final ParseRoadmapCatalogue catalogue;
    private final NimRoadmapGenerator generator;

    public RoleRoadmapService(ParseRoadmapCatalogue catalogue, NimRoadmapGenerator generator) {
        this.catalogue = catalogue;
        this.generator = generator;
    }

    public RoleRoadmap forRole(String jobTitle) {
        String title = jobTitle == null ? "" : jobTitle.trim().replaceAll("\\s+", " ");
        // Short role-only input avoids passing a profile or arbitrary personal details to NVIDIA.
        if (!ROLE.matcher(title).matches())
            throw ApiException.badRequest("Enter a job title between 3 and 80 characters without contact details or URLs.");
        String normalized = normalize(title);
        for (ParseRoadmapCatalogue.RoadmapSummary roadmap : catalogue.list()) {
            if (normalize(roadmap.title()).equals(normalized) ||
                normalize(roadmap.id().replace('-', ' ')).equals(normalized)) {
                return new RoleRoadmap("ROADMAP_SH", roadmap.title(), roadmap.description(), roadmap.url(),
                    java.util.List.of(), null, null);
            }
        }
        return generator.generate(title);
    }

    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", " ").trim();
    }
}
