package io.samved.roadmap;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoadmapRepository extends JpaRepository<Roadmap, Long> {
    List<Roadmap> findByStudentIdOrderByCreatedAtDesc(long studentId);
    Optional<Roadmap> findByIdAndStudentId(long id, long studentId);
}
