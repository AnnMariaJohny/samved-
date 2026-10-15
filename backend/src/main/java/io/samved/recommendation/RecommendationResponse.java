package io.samved.recommendation;

import java.util.List;

public record RecommendationResponse(String ruleVersion, String guidance, boolean exploratory,
                                     List<RecommendationDto> recommendations, String source) {
    // Preserve the rule service's simple constructor for callers and existing tests.
    public RecommendationResponse(String ruleVersion, String guidance, boolean exploratory,
                                  List<RecommendationDto> recommendations) {
        this(ruleVersion, guidance, exploratory, recommendations, "RULES");
    }
}
