package io.samved.assessment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface AssessmentResponseRepository extends JpaRepository<AssessmentResponse, Long> {
    List<AssessmentResponse> findByStudentIdAndQuestionVersion(long studentId, int questionVersion);
    void deleteByStudentIdAndQuestionVersion(long studentId, int questionVersion);
}
