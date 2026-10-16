package io.samved.common;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Christa calls this before deleting a student's profile/account. */
@Service
public class DeveloperADataDeletion {
    private final JdbcTemplate database;

    public DeveloperADataDeletion(JdbcTemplate database) { this.database = database; }

    @Transactional
    public void deleteForStudent(long studentId) {
        if (studentId <= 0) throw ApiException.badRequest("Student ID is invalid.");
        // Tasks reference milestones and roadmaps, so delete them first.
        database.update("DELETE FROM task_notifications WHERE student_id = ?", studentId);
        database.update("DELETE FROM learning_tasks WHERE student_id = ?", studentId);
        database.update("DELETE FROM student_action_plans WHERE student_id = ?", studentId);
        database.update("DELETE FROM roadmap_milestones WHERE roadmap_id IN (SELECT id FROM roadmaps WHERE student_id = ?)", studentId);
        database.update("DELETE FROM roadmaps WHERE student_id = ?", studentId);
        database.update("DELETE FROM assessment_responses WHERE student_id = ?", studentId);
    }
}
