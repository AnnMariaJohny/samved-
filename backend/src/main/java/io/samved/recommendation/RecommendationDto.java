package io.samved.recommendation;

import java.util.List;

/** Score is a relative matching aid, never a prediction of career success. */
public record RecommendationDto(String careerId, String careerTitle, int score,
                                List<String> reasons, List<String> matchedSkills,
                                List<String> skillGaps, List<String> matchedInterests,
                                String ruleVersion, Integer aiMatchPercent, String aiExplanation) {
    public RecommendationDto(String careerId,String careerTitle,int score,List<String> reasons,
        List<String> matchedSkills,List<String> skillGaps,List<String> matchedInterests,String ruleVersion) {
        this(careerId,careerTitle,score,reasons,matchedSkills,skillGaps,matchedInterests,ruleVersion,null,null);
    }
}
