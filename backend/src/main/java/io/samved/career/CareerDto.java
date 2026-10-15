package io.samved.career;

import java.util.List;

/** The catalogue response avoids exposing JPA entities. */
public record CareerDto(String id, String title, String summary, List<String> interests,
                        List<String> requiredSkills, List<String> strengths, List<String> values) {
    static CareerDto from(Career career) {
        return new CareerDto(career.getId(), career.getTitle(), career.getSummary(),
                career.getInterests(), career.getRequiredSkills(), career.getStrengths(), career.getValues());
    }
}
