package io.samved.assessment;

import io.samved.common.ApiException;
import io.samved.common.StudentContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AssessmentService {
    public record Answer(String questionId, String optionId) {}
    public record Submission(int questionVersion, List<Answer> answers) {}
    public record Current(int questionVersion, List<AssessmentCatalog.Question> questions, List<Answer> answers) {}
    public record Result(int questionVersion, Map<String, Integer> dimensionCounts,
                         List<String> leadingDimensions, String careerConfidence,
                         int answeredQuestions, String explanation) {}

    private final AssessmentResponseRepository repository;
    private final StudentContext studentContext;

    AssessmentService(AssessmentResponseRepository repository, StudentContext studentContext) {
        this.repository = repository;
        this.studentContext = studentContext;
    }

    @Transactional(readOnly = true)
    public Current current() {
        long studentId = studentContext.requireStudentId();
        return new Current(AssessmentCatalog.VERSION, AssessmentCatalog.questions(), savedAnswers(studentId));
    }

    @Transactional
    public Current submit(Submission submission) {
        long studentId = studentContext.requireStudentId();
        // Validate the complete replacement before touching the student's existing answers.
        validate(submission);
        repository.deleteByStudentIdAndQuestionVersion(studentId, AssessmentCatalog.VERSION);
        repository.flush(); // Execute deletes before inserts that reuse the unique question keys.
        Instant now = Instant.now();
        List<AssessmentResponse> replacements = submission.answers().stream()
                .map(answer -> new AssessmentResponse(studentId, AssessmentCatalog.VERSION,
                        answer.questionId(), answer.optionId(), now))
                .toList();
        repository.saveAll(replacements);
        return new Current(AssessmentCatalog.VERSION, AssessmentCatalog.questions(), submission.answers());
    }

    @Transactional(readOnly = true)
    public Result result() {
        return resultForStudent(studentContext.requireStudentId());
    }

    @Transactional(readOnly = true)
    public Result resultForStudent(long studentId) {
        List<Answer> answers = savedAnswers(studentId);
        if (answers.isEmpty()) {
            throw ApiException.notFound("Complete the assessment before requesting a result.");
        }
        if (answers.size() != AssessmentCatalog.questions().size()) {
            throw ApiException.badRequest("The saved assessment is incomplete. Submit all current questions again.");
        }

        Map<String, Integer> counts = new java.util.TreeMap<>();
        String confidence = null;
        for (Answer answer : answers) {
            AssessmentCatalog.Question question = AssessmentCatalog.question(answer.questionId());
            if (question == null) {
                throw ApiException.badRequest("The saved assessment uses an unknown question. Submit it again.");
            }
            AssessmentCatalog.Option option = question.options().stream()
                    .filter(candidate -> candidate.id().equals(answer.optionId()))
                    .findFirst().orElseThrow(() -> ApiException.badRequest(
                            "The saved assessment uses an unknown option. Submit it again."));
            if ("confidence".equals(answer.questionId())) {
                confidence = answer.optionId();
            } else if (option.dimension() != null) {
                counts.merge(option.dimension(), 1, Integer::sum);
            }
        }
        // Counts are descriptive signals, not a claim that a career outcome can be predicted.
        int maximum = counts.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        List<String> leaders = counts.entrySet().stream()
                .filter(entry -> entry.getValue() == maximum && maximum > 0)
                .map(Map.Entry::getKey).sorted().toList();
        return new Result(AssessmentCatalog.VERSION, Map.copyOf(counts), leaders, confidence,
                answers.size(), "These counts reflect the choices you made; they are not a career prediction.");
    }

    private List<Answer> savedAnswers(long studentId) {
        Map<String, String> byQuestion = repository.findByStudentIdAndQuestionVersion(
                        studentId, AssessmentCatalog.VERSION).stream()
                .collect(Collectors.toMap(AssessmentResponse::questionId, AssessmentResponse::optionId));
        // Return catalogue order so a page can render reliably regardless of database row order.
        return AssessmentCatalog.questions().stream()
                .filter(question -> byQuestion.containsKey(question.id()))
                .map(question -> new Answer(question.id(), byQuestion.get(question.id())))
                .toList();
    }

    private void validate(Submission submission) {
        if (submission == null || submission.questionVersion() != AssessmentCatalog.VERSION) {
            throw ApiException.badRequest("Use the current assessment question version.");
        }
        if (submission.answers() == null || submission.answers().size() != AssessmentCatalog.questions().size()) {
            throw ApiException.badRequest("Answer every current assessment question exactly once.");
        }
        Set<String> seen = new HashSet<>();
        for (Answer answer : submission.answers()) {
            if (answer == null || answer.questionId() == null || answer.optionId() == null) {
                throw ApiException.badRequest("Question and option IDs are required.");
            }
            AssessmentCatalog.Question question = AssessmentCatalog.question(answer.questionId());
            if (question == null || !seen.add(answer.questionId())) {
                throw ApiException.badRequest("Questions must be unique and from the current assessment.");
            }
            if (question.options().stream().noneMatch(option -> option.id().equals(answer.optionId()))) {
                throw ApiException.badRequest("An option does not belong to its question.");
            }
        }
        if (seen.size() != AssessmentCatalog.questions().size()) {
            throw ApiException.badRequest("Answer every current assessment question exactly once.");
        }
    }
}
