package db.migration;

import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** Stores one private reminder per task, due date, and reminder kind. */
public class V2__task_notifications extends BaseJavaMigration {
    @Override
    public void migrate(Context context) throws Exception {
        try (Statement sql = context.getConnection().createStatement()) {
            sql.execute("""
                CREATE TABLE task_notifications (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    student_id BIGINT NOT NULL,
                    task_id BIGINT NOT NULL,
                    due_date DATE NOT NULL,
                    kind VARCHAR(20) NOT NULL,
                    message VARCHAR(240) NOT NULL,
                    created_at DATETIME(6) NOT NULL,
                    read_at DATETIME(6) NULL,
                    CONSTRAINT uq_task_notification UNIQUE (task_id, due_date, kind),
                    INDEX idx_notifications_student (student_id, created_at)
                ) ENGINE=InnoDB
                """);
        }
    }
}
