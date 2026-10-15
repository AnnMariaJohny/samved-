package db.migration;

import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/**
 * Creates Developer A's tables in MySQL. The student_id columns are linked to
 * Christa's profile table by a later migration, after her table name is final.
 * Keeping the migration in Java meets the project's Java-only backend rule.
 */
public class V1__developer_a_schema extends BaseJavaMigration {
    @Override
    public void migrate(Context context) throws Exception {
        try (Statement sql = context.getConnection().createStatement()) {
            sql.execute("""
                CREATE TABLE careers (
                    id VARCHAR(80) NOT NULL PRIMARY KEY,
                    title VARCHAR(120) NOT NULL,
                    summary VARCHAR(600) NOT NULL
                ) ENGINE=InnoDB
                """);

            // Ordered element collections mirror the four lists on Career.java.
            sql.execute("""
                CREATE TABLE career_interests (
                    career_id VARCHAR(80) NOT NULL,
                    sort_order INT NOT NULL,
                    interest VARCHAR(100) NOT NULL,
                    PRIMARY KEY (career_id, sort_order),
                    CONSTRAINT fk_career_interests FOREIGN KEY (career_id) REFERENCES careers(id)
                ) ENGINE=InnoDB
                """);
            sql.execute("""
                CREATE TABLE career_required_skills (
                    career_id VARCHAR(80) NOT NULL,
                    sort_order INT NOT NULL,
                    skill VARCHAR(100) NOT NULL,
                    PRIMARY KEY (career_id, sort_order),
                    CONSTRAINT fk_career_skills FOREIGN KEY (career_id) REFERENCES careers(id)
                ) ENGINE=InnoDB
                """);
            sql.execute("""
                CREATE TABLE career_strengths (
                    career_id VARCHAR(80) NOT NULL,
                    sort_order INT NOT NULL,
                    strength VARCHAR(100) NOT NULL,
                    PRIMARY KEY (career_id, sort_order),
                    CONSTRAINT fk_career_strengths FOREIGN KEY (career_id) REFERENCES careers(id)
                ) ENGINE=InnoDB
                """);
            sql.execute("""
                CREATE TABLE career_values (
                    career_id VARCHAR(80) NOT NULL,
                    sort_order INT NOT NULL,
                    career_value VARCHAR(100) NOT NULL,
                    PRIMARY KEY (career_id, sort_order),
                    CONSTRAINT fk_career_values FOREIGN KEY (career_id) REFERENCES careers(id)
                ) ENGINE=InnoDB
                """);

            sql.execute("""
                CREATE TABLE assessment_responses (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    student_id BIGINT NOT NULL,
                    question_version INT NOT NULL,
                    question_id VARCHAR(60) NOT NULL,
                    option_id VARCHAR(60) NOT NULL,
                    answered_at DATETIME(6) NOT NULL,
                    CONSTRAINT uq_assessment_student_version_question UNIQUE (student_id, question_version, question_id),
                    INDEX idx_assessment_student_version (student_id, question_version)
                ) ENGINE=InnoDB
                """);

            sql.execute("""
                CREATE TABLE roadmaps (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    student_id BIGINT NOT NULL,
                    template_code VARCHAR(40) NOT NULL,
                    goal VARCHAR(160) NOT NULL,
                    created_at DATETIME(6) NOT NULL,
                    CONSTRAINT uq_roadmap_student_template UNIQUE (student_id, template_code),
                    INDEX idx_roadmaps_student (student_id)
                ) ENGINE=InnoDB
                """);
            sql.execute("""
                CREATE TABLE roadmap_milestones (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    roadmap_id BIGINT NOT NULL,
                    position_index INT NOT NULL,
                    title VARCHAR(160) NOT NULL,
                    description VARCHAR(1000) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    INDEX idx_milestones_roadmap (roadmap_id),
                    CONSTRAINT fk_milestone_roadmap FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
                ) ENGINE=InnoDB
                """);
            sql.execute("""
                CREATE TABLE learning_tasks (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    student_id BIGINT NOT NULL,
                    roadmap_id BIGINT NULL,
                    milestone_id BIGINT NULL,
                    title VARCHAR(160) NOT NULL,
                    description VARCHAR(1000) NULL,
                    due_date DATE NULL,
                    status VARCHAR(20) NOT NULL,
                    created_at DATETIME(6) NOT NULL,
                    INDEX idx_tasks_student (student_id),
                    CONSTRAINT fk_task_roadmap FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id),
                    CONSTRAINT fk_task_milestone FOREIGN KEY (milestone_id) REFERENCES roadmap_milestones(id)
                ) ENGINE=InnoDB
                """);
            sql.execute("""
                CREATE TABLE opportunities (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    type VARCHAR(40) NOT NULL,
                    title VARCHAR(180) NOT NULL,
                    organizer VARCHAR(120) NOT NULL,
                    summary VARCHAR(500) NOT NULL,
                    application_url VARCHAR(1000) NOT NULL,
                    source_name VARCHAR(100) NOT NULL,
                    source_url VARCHAR(700) NOT NULL,
                    verified_at DATETIME(6) NOT NULL,
                    deadline DATE NULL,
                    closes_at DATETIME(6) NULL,
                    deadline_zone VARCHAR(60) NULL,
                    location VARCHAR(100) NULL,
                    eligibility VARCHAR(1000) NULL,
                    published BIT NOT NULL,
                    CONSTRAINT uq_opportunity_source_url UNIQUE (source_url),
                    INDEX idx_opportunities_deadline (deadline),
                    INDEX idx_opportunities_type (type)
                ) ENGINE=InnoDB
                """);
        }
    }
}
