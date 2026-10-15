package io.samved.assessment;

import io.samved.common.ApiException;
import io.samved.common.StudentContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AssessmentServiceTest {
    private AssessmentResponseRepository repository;
    private StudentContext studentContext;
    private AssessmentService service;

    @BeforeEach
    void setUp() {
        repository = mock(AssessmentResponseRepository.class);
        studentContext = mock(StudentContext.class);
        service = new AssessmentService(repository, studentContext);
    }

    @Test
    void currentOnlyReadsSignedInStudent() {
        when(studentContext.requireStudentId()).thenReturn(41L);
        when(repository.findByStudentIdAndQuestionVersion(41L, 1)).thenReturn(List.of());

        AssessmentService.Current current = service.current();

        assertEquals(8, current.questions().size());
        assertTrue(current.answers().isEmpty());
        verify(repository).findByStudentIdAndQuestionVersion(41L, 1);
        verify(repository, never()).findByStudentIdAndQuestionVersion(42L, 1);
    }

    @Test
    void completeReplacementUsesIdentityFromServer() {
        when(studentContext.requireStudentId()).thenReturn(41L);

        service.submit(validSubmission());

        verify(repository).deleteByStudentIdAndQuestionVersion(41L, 1);
        verify(repository).flush();
        verify(repository).saveAll(org.mockito.ArgumentMatchers.<List<AssessmentResponse>>argThat(
                responses -> responses.size() == 8));
        verify(repository, never()).deleteByStudentIdAndQuestionVersion(42L, 1);
    }

    @Test
    void invalidReplacementLeavesExistingAnswersAlone() {
        var original = validSubmission();
        var invalid = new AssessmentService.Submission(1,
                List.of(original.answers().get(0), original.answers().get(0)));

        assertThrows(ApiException.class, () -> service.submit(invalid));

        verify(repository, never()).deleteByStudentIdAndQuestionVersion(anyLong(), anyInt());
    }

    @Test
    void resultIsDeterministicAndDoesNotCountConfidenceAsCareerSignal() {
        when(studentContext.requireStudentId()).thenReturn(41L);
        var submission = validSubmission();
        when(repository.findByStudentIdAndQuestionVersion(41L, 1)).thenReturn(
                submission.answers().stream().map(answer -> new AssessmentResponse(
                        41L, 1, answer.questionId(), answer.optionId(), Instant.EPOCH)).toList());

        var first = service.result();
        var second = service.result();

        assertEquals(first, second);
        assertEquals("very", first.careerConfidence());
        assertEquals(8, first.answeredQuestions());
        assertEquals(7, first.dimensionCounts().values().stream().mapToInt(Integer::intValue).sum());
    }

    @Test
    void resultCannotReadAnotherStudentAnswers() {
        when(studentContext.requireStudentId()).thenReturn(42L);
        when(repository.findByStudentIdAndQuestionVersion(42L, 1)).thenReturn(List.of());

        assertThrows(ApiException.class, () -> service.result());

        verify(repository).findByStudentIdAndQuestionVersion(42L, 1);
        verify(repository, never()).findByStudentIdAndQuestionVersion(41L, 1);
    }

    private AssessmentService.Submission validSubmission() {
        return new AssessmentService.Submission(1, AssessmentCatalog.questions().stream()
                .map(question -> new AssessmentService.Answer(question.id(), question.options().get(0).id()))
                .toList());
    }
}
