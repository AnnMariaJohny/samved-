package io.samved.career;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CareerRepository extends JpaRepository<Career, String> {
    List<Career> findAllByOrderByTitleAsc();
}
