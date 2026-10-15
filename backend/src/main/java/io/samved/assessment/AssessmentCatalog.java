package io.samved.assessment;

import java.util.List;
import java.util.Map;

/** The version number makes saved answers interpretable after a future question change. */
public final class AssessmentCatalog {
    public static final int VERSION = 1;

    public record Option(String id, String label, String dimension) {}
    public record Question(String id, String text, List<Option> options) {}

    private static final List<Question> QUESTIONS = List.of(
            question("work", "What type of work do you enjoy most?",
                    option("technical", "Solving technical problems", "TECHNOLOGY"),
                    option("helping", "Helping people", "SERVICE"),
                    option("creating", "Creating new ideas", "CREATIVITY"),
                    option("research", "Researching and discovering", "RESEARCH"),
                    option("leading", "Managing or leading", "LEADERSHIP")),
            question("activity", "Which activity sounds most interesting to you?",
                    option("building", "Building or programming something", "TECHNOLOGY"),
                    option("experimenting", "Conducting experiments", "RESEARCH"),
                    option("designing", "Designing something creative", "CREATIVITY"),
                    option("teaching", "Teaching or explaining", "SERVICE"),
                    option("organising", "Organising a project", "LEADERSHIP")),
            question("problem", "How do you usually approach a difficult problem?",
                    option("breaking_down", "Break it into smaller parts", "TECHNOLOGY"),
                    option("gathering", "Research and gather information", "RESEARCH"),
                    option("asking", "Ask others for ideas", "SERVICE"),
                    option("experimenting", "Try different creative approaches", "CREATIVITY"),
                    option("acting", "Take action and adjust along the way", "LEADERSHIP")),
            question("environment", "Which environment would you prefer?",
                    option("lab", "Laboratory or research environment", "RESEARCH"),
                    option("software", "Technology or software environment", "TECHNOLOGY"),
                    option("business", "Office or business environment", "LEADERSHIP"),
                    option("classroom", "Classroom or educational environment", "SERVICE"),
                    option("outdoors", "Field or outdoor environment", "EXPLORATION")),
            question("motivation", "What motivates you the most?",
                    option("learning", "Learning new things", "RESEARCH"),
                    option("helping", "Helping others", "SERVICE"),
                    option("making", "Creating something useful", "CREATIVITY"),
                    option("challenge", "Achieving challenging goals", "LEADERSHIP"),
                    option("impact", "Making a positive social impact", "SERVICE")),
            question("working_style", "How do you prefer to work?",
                    option("independent", "Mostly independently", "INDEPENDENCE"),
                    option("team", "As part of a team", "COLLABORATION"),
                    option("lead", "Leading a team", "LEADERSHIP"),
                    option("mixed", "A combination of all three", "FLEXIBILITY")),
            question("skill", "Which skill would you most like to develop?",
                    option("technical", "Technical skills", "TECHNOLOGY"),
                    option("communication", "Communication", "SERVICE"),
                    option("leadership", "Leadership", "LEADERSHIP"),
                    option("creative", "Creative thinking", "CREATIVITY"),
                    option("analysis", "Research and analysis", "RESEARCH")),
            question("confidence", "How confident are you about your current career direction?",
                    option("very", "Very confident", null),
                    option("somewhat", "Somewhat confident", null),
                    option("exploring", "I am exploring a few options", null),
                    option("unsure", "I am not sure yet", null)));

    private static final Map<String, Question> BY_ID = QUESTIONS.stream()
            .collect(java.util.stream.Collectors.toUnmodifiableMap(Question::id, question -> question));

    private AssessmentCatalog() {}

    public static List<Question> questions() { return QUESTIONS; }

    public static Question question(String id) { return BY_ID.get(id); }

    private static Question question(String id, String text, Option... options) {
        return new Question(id, text, List.of(options));
    }

    private static Option option(String id, String label, String dimension) {
        return new Option(id, label, dimension);
    }
}
