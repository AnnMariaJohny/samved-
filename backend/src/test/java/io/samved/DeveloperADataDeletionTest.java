package io.samved;

import static org.assertj.core.api.Assertions.assertThat;

import io.samved.common.DeveloperADataDeletion;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/** Checks account cleanup removes one student's records without touching another's. */
@SpringBootTest
@Transactional
class DeveloperADataDeletionTest {
    @Autowired JdbcTemplate database;
    @Autowired DeveloperADataDeletion cleanup;

    @Test
    void deletesOnlyTheRequestedStudentsPrivateRows() {
        String insert = "INSERT INTO assessment_responses(student_id,question_version,question_id,option_id,answered_at) VALUES (?,?,?,?,?)";
        database.update(insert, 41L, 1, "q1", "a", java.sql.Timestamp.from(Instant.now()));
        database.update(insert, 42L, 1, "q1", "b", java.sql.Timestamp.from(Instant.now()));

        cleanup.deleteForStudent(41L);

        assertThat(database.queryForObject("SELECT COUNT(*) FROM assessment_responses WHERE student_id=41", Long.class)).isZero();
        assertThat(database.queryForObject("SELECT COUNT(*) FROM assessment_responses WHERE student_id=42", Long.class)).isEqualTo(1);
    }
}
