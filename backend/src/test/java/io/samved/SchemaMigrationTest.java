package io.samved;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Checks that Flyway's Java migration creates tables matching the JPA entities. */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:samvedmigration;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.flyway.enabled=true",
    "spring.jpa.hibernate.ddl-auto=validate"
})
class SchemaMigrationTest {
    @Autowired DataSource database;

    @Test
    void migrationCreatesApplicationTables() throws Exception {
        try (var connection = database.getConnection(); var statement = connection.createStatement()) {
            var result = statement.executeQuery("SELECT COUNT(*) FROM careers");
            assertThat(result.next()).isTrue();
            assertThat(result.getLong(1)).isGreaterThan(0);
        }
    }
}
