package io.samved.task;
import io.samved.common.StudentContext;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/action-plan")
public class ActionPlanController {
    private final ActionPlanService plans;private final StudentContext context;
    public ActionPlanController(ActionPlanService plans,StudentContext context){this.plans=plans;this.context=context;}
    @PostMapping("/ensure") public ActionPlanService.View ensure(){return plans.ensure(context.requireStudentId());}
}
