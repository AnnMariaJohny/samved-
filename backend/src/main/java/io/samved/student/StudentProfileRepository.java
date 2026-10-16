package io.samved.student;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByAccountId(long id);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from StudentProfile p where p.id = :id")
    Optional<StudentProfile> lockForPlan(@org.springframework.data.repository.query.Param("id") long id);
}
