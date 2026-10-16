package db.migration;

import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V6__automatic_action_plans extends BaseJavaMigration {
    @Override public void migrate(Context context) throws Exception {
        try(Statement sql=context.getConnection().createStatement()) {
            sql.execute("ALTER TABLE learning_tasks ADD COLUMN auto_plan_key VARCHAR(64)");
            sql.execute("CREATE TABLE student_action_plans (student_id BIGINT PRIMARY KEY, fingerprint VARCHAR(64) NOT NULL, goal VARCHAR(160) NOT NULL, source VARCHAR(20) NOT NULL, summary VARCHAR(1000) NOT NULL, generated_at TIMESTAMP NOT NULL, through_date DATE NOT NULL)");
        }
    }
}
