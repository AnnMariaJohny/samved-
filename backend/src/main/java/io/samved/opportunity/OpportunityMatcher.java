package io.samved.opportunity;

import io.samved.common.StudentSnapshot;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Small, explainable relevance rule for opportunity discovery. */
public final class OpportunityMatcher {
    private OpportunityMatcher() { }

    public static Match match(Opportunity opportunity, StudentSnapshot student) {
        if (student == null) return new Match(0, List.of());
        Set<String> signals = new LinkedHashSet<>();
        add(signals, student.interests());
        add(signals, student.skills());
        // A custom goal can guide discovery; the enum-like goal type is too broad.
        if (student.goalText() != null) add(signals, List.of(student.goalText()));
        String goal=student.goalText()==null?"":student.goalText().toLowerCase(Locale.ROOT);
        if(goal.contains("research")||goal.contains("scientist"))add(signals,List.of("research","science","laboratory","statistics"));
        if(goal.contains("software")||goal.contains("developer"))add(signals,List.of("software","programming","technology"));
        if(goal.contains("design"))add(signals,List.of("design","creative"));
        String title = normalize(opportunity.getTitle());
        String description = normalize(opportunity.getSummary());
        String organizer = normalize(opportunity.getOrganizer());
        String type = normalize(opportunity.getType());
        int score = 0;
        Set<String> seen=new java.util.HashSet<>();
        List<String> reasons = new ArrayList<>();
        for (String signal : signals.stream().limit(30).toList()) {
            String normalized = normalize(signal);
            if(!seen.add(normalized))continue;
            if (normalized.length() < 3) continue;
            int weight = containsPhrase(title, normalized) ? 4
                : containsPhrase(description, normalized) ? 2
                : containsPhrase(organizer, normalized) || containsPhrase(type, normalized) ? 1 : 0;
            if (weight > 0) {
                score += weight;
                reasons.add(signal);
            }
        }
        return new Match(score, List.copyOf(reasons));
    }

    private static void add(Set<String> into, List<String> values) {
        if (values == null) return;
        for (String value : values) if (value != null && !value.isBlank()) into.add(value.trim());
    }

    private static String normalize(String value) {
        if (value == null) return "";
        return " " + Normalizer.normalize(value, Normalizer.Form.NFKC)
            .toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", " ").trim() + " ";
    }

    private static boolean containsPhrase(String field, String phrase) {
        return field.contains(phrase.trim().isEmpty() ? "\u0000" : phrase);
    }

    /** A relevance score is an ordering hint, never an eligibility guarantee. */
    public record Match(int score, List<String> matchedSignals) { }
}
