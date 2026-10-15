package db.migration;

import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** Persists the first validated Parse catalogue so app restarts cost no new API call. */
public class V3__roadmap_catalogue_cache extends BaseJavaMigration {
    @Override
    public void migrate(Context context) throws Exception {
        try (Statement sql = context.getConnection().createStatement()) {
            sql.execute("""
                CREATE TABLE roadmap_catalogue_entries (
                    id VARCHAR(100) NOT NULL PRIMARY KEY,
                    sort_order INT NOT NULL,
                    title VARCHAR(160) NOT NULL,
                    description VARCHAR(500) NOT NULL,
                    url VARCHAR(260) NOT NULL,
                    tags_json VARCHAR(2000) NOT NULL,
                    updated_at VARCHAR(80) NOT NULL
                ) ENGINE=InnoDB
                """);
        }
    }
}
