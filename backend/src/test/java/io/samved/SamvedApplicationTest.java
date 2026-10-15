package io.samved;

import static org.assertj.core.api.Assertions.assertThat;

import io.samved.career.CareerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Starts the whole Java application against the test database, including JPA mappings and catalogue seed. */
@SpringBootTest
class SamvedApplicationTest {
    @Autowired CareerRepository careers;

    @Test
    void applicationStartsAndSeedsOriginalCareers() {
        assertThat(careers.count()).isGreaterThan(0);
    }
}
