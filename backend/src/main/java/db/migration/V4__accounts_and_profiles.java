package db.migration;

import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V4__accounts_and_profiles extends BaseJavaMigration {
    @Override public void migrate(Context context) throws Exception {
        try (Statement sql = context.getConnection().createStatement()) {
            sql.execute("""
                CREATE TABLE users (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(254) NOT NULL UNIQUE,
                    password_hash VARCHAR(100) NOT NULL,
                    accepted_at TIMESTAMP(6) NOT NULL,
                    privacy_version VARCHAR(30) NOT NULL,
                    session_version BIGINT NOT NULL DEFAULT 0
                ) ENGINE=InnoDB
                """);
            sql.execute("""
                CREATE TABLE student_profiles (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL UNIQUE,
                    version BIGINT NOT NULL DEFAULT 0,
                    name VARCHAR(100) NOT NULL,
                    education_level VARCHAR(30) NOT NULL,
                    city_region VARCHAR(100) NOT NULL,
                    goal_type VARCHAR(20) NOT NULL,
                    goal_text VARCHAR(160),
                    interests TEXT NOT NULL,
                    skills TEXT NOT NULL,
                    strengths TEXT NOT NULL,
                    values_json TEXT NOT NULL,
                    academics TEXT NOT NULL,
                    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id)
                ) ENGINE=InnoDB
                """);
        }
    }
}
