package io.samved.recommendation;

import java.util.List;

/** Score is a relative matching aid, never a prediction of career success. */
public record RecommendationDto(String careerId, String careerTitle, int score,
                                List<String> reasons, List<String> matchedSkills,
                                List<String> skillGaps, List<String> matchedInterests,
                                String ruleVersion) { }
