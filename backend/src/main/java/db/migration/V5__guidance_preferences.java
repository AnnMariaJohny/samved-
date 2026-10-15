package db.migration;

import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** Existing profiles keep their answers; new review markers distinguish empty answers from unvisited sections. */
public class V5__guidance_preferences extends BaseJavaMigration {
    @Override public void migrate(Context context) throws Exception {
        try(Statement sql=context.getConnection().createStatement()) {
            sql.execute("ALTER TABLE student_profiles ADD COLUMN reviewed_sections VARCHAR(500) NOT NULL DEFAULT '[]'");
            sql.execute("ALTER TABLE student_profiles ADD COLUMN roadmap_preferences VARCHAR(4000) NOT NULL DEFAULT '{\"savedSlugs\":[],\"activeSlug\":null}'");
        }
    }
}
