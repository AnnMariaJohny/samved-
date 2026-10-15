package io.samved.career;

import io.samved.common.ApiException;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Read-only career catalogue; catalogue text is authored for SAMVED. */
@RestController
@RequestMapping("/api/v1/careers")
public class CareerController {
    private final CareerRepository careers;

    public CareerController(CareerRepository careers) { this.careers = careers; }

    @GetMapping
    public List<CareerDto> list() {
        return careers.findAllByOrderByTitleAsc().stream().map(CareerDto::from).toList();
    }

    @GetMapping("/{id}")
    public CareerDto get(@PathVariable String id) {
        return careers.findById(id).map(CareerDto::from)
                .orElseThrow(() -> ApiException.notFound("Career not found"));
    }
}
