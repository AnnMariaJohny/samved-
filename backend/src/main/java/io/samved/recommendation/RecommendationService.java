package io.samved.recommendation;

import io.samved.career.Career;
import io.samved.common.StudentSnapshot;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/** A transparent, deterministic starting rule that can be reviewed and revised. */
@Service
public class RecommendationService {
    public static final String RULE_VERSION = "samved-match-v2";
    // This small, explicit map connects descriptive assessment choices to catalogue paths.
    private static final Map<String, Set<String>> ASSESSMENT_THEMES = Map.of(
        "software-engineer", Set.of("TECHNOLOGY"),
        "data-analyst", Set.of("TECHNOLOGY", "RESEARCH"),
        "research-scientist", Set.of("RESEARCH"),
        "doctor", Set.of("SERVICE", "RESEARCH"),
        "teacher", Set.of("SERVICE"),
        "designer", Set.of("CREATIVITY"),
        "entrepreneur", Set.of("LEADERSHIP"),
        "civil-engineer", Set.of("TECHNOLOGY"));

    public RecommendationResponse recommend(StudentSnapshot student, List<Career> catalogue) {
        return recommend(student, catalogue, Set.of());
    }

    public RecommendationResponse recommend(StudentSnapshot student, List<Career> catalogue,
                                            Set<String> assessmentDimensions) {
        boolean exploring = "EXPLORING".equalsIgnoreCase(student.goalType());
        String goal = normalize(student.goalText());
        Set<String> interests = normalized(student.interests());
        Set<String> skills = normalized(student.skills());
        Set<String> strengths = normalized(student.strengths());
        Set<String> values = normalized(student.values());
        Set<String> dimensions = assessmentDimensions == null ? Set.of() : assessmentDimensions;
        boolean hasSignals = !(interests.isEmpty() && skills.isEmpty() && strengths.isEmpty() && values.isEmpty()
            && dimensions.isEmpty());
        boolean hasGoal = !goal.isEmpty() && !exploring;

        if (!hasSignals && !hasGoal) {
            return new RecommendationResponse(RULE_VERSION,
                    "Add interests or skills to explore careers. SAMVED cannot infer a good match yet.", true, List.of());
        }

        List<RecommendationDto> ranked = catalogue.stream()
                .map(career -> score(career, interests, skills, strengths, values, goal, hasGoal, dimensions))
                .filter(item -> item.score() > 0)
                // Stable tie-breaking makes the same student inputs produce the same ordering.
                .sorted(Comparator.comparingInt(RecommendationDto::score).reversed()
                        .thenComparing(RecommendationDto::careerId))
                .limit(5)
                .toList();

        boolean knownGoal = hasGoal && catalogue.stream().anyMatch(c -> matchesGoal(c, goal));
        String guidance = exploring
                ? "These are ideas to explore from your stated interests and skills, not a chosen career or prediction."
                : hasGoal && !knownGoal
                    ? "Your goal is not in the starter catalogue. These suggestions use your other profile details; your custom goal remains yours."
                    : "These matches are provisional suggestions based on your profile, not a prediction or admission advice.";
        return new RecommendationResponse(RULE_VERSION, guidance, exploring || !knownGoal, ranked);
    }

    private RecommendationDto score(Career career, Set<String> interests, Set<String> skills,
                                    Set<String> strengths, Set<String> values, String goal, boolean hasGoal,
                                    Set<String> assessmentDimensions) {
        List<String> matchedInterests = matching(career.getInterests(), interests);
        List<String> matchedSkills = matching(career.getRequiredSkills(), skills);
        List<String> matchedStrengths = matching(career.getStrengths(), strengths);
        List<String> matchedValues = matching(career.getValues(), values);
        List<String> skillGaps = career.getRequiredSkills().stream()
                .filter(skill -> !skills.contains(normalize(skill))).toList();
        boolean goalMatch = hasGoal && matchesGoal(career, goal);

        // Each category has a fixed cap so long catalogues do not automatically win.
        // Missing profile categories receive zero; we never infer an unstated skill.
        int interestPoints = share(matchedInterests.size(), career.getInterests().size(), 30);
        int skillPoints = share(matchedSkills.size(), career.getRequiredSkills().size(), 35);
        int strengthPoints = share(matchedStrengths.size(), career.getStrengths().size(), 15);
        int valuePoints = share(matchedValues.size(), career.getValues().size(), 10);
        int goalPoints = goalMatch ? 10 : 0;
        Set<String> careerThemes = ASSESSMENT_THEMES.getOrDefault(career.getId(), Set.of());
        boolean assessmentMatch = careerThemes.stream().anyMatch(assessmentDimensions::contains);
        // Assessment contributes at most ten points; the capped score stays in 0..100.
        int score = Math.min(100, interestPoints + skillPoints + strengthPoints + valuePoints
            + goalPoints + (assessmentMatch ? 10 : 0));

        List<String> reasons = new ArrayList<>();
        if (goalMatch) reasons.add("Matches your stated career goal.");
        if (!matchedInterests.isEmpty()) reasons.add("Interest overlap: " + String.join(", ", matchedInterests) + ".");
        if (!matchedSkills.isEmpty()) reasons.add("Existing skills: " + String.join(", ", matchedSkills) + ".");
        if (!matchedStrengths.isEmpty()) reasons.add("Strength overlap: " + String.join(", ", matchedStrengths) + ".");
        if (!matchedValues.isEmpty()) reasons.add("Value overlap: " + String.join(", ", matchedValues) + ".");
        if (assessmentMatch) reasons.add("A leading assessment theme relates to this career.");
        // Gaps are learning prompts. They are never treated as a negative personal judgement.
        return new RecommendationDto(career.getId(), career.getTitle(), score, List.copyOf(reasons),
                matchedSkills, skillGaps, matchedInterests, RULE_VERSION);
    }

    private static int share(int matched, int total, int cap) {
        return total == 0 ? 0 : (int) Math.round((double) matched * cap / total);
    }

    private static boolean matchesGoal(Career career, String goal) {
        return normalize(career.getId()).equals(goal) || normalize(career.getTitle()).equals(goal);
    }

    private static List<String> matching(List<String> catalogueValues, Set<String> studentValues) {
        return catalogueValues.stream().filter(value -> studentValues.contains(normalize(value))).toList();
    }

    private static Set<String> normalized(List<String> values) {
        if (values == null) return Set.of();
        return values.stream().map(RecommendationService::normalize).filter(value -> !value.isEmpty())
                .collect(Collectors.toSet());
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
