package io.samved.task;
import java.time.LocalDate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
@Component
public class ActionPlanScheduling {
    private final StudentActionPlanRepository plans;private final ActionPlanService service;
    public ActionPlanScheduling(StudentActionPlanRepository plans,ActionPlanService service){this.plans=plans;this.service=service;}
    @Scheduled(cron="0 10 0 * * *",zone="Asia/Kolkata")
    public void renewExpiredWeeks(){
        for(var plan:plans.findByThroughDateBefore(LocalDate.now(ActionPlanService.ZONE)))try{service.ensure(plan.studentId);}
        catch(RuntimeException error){ /* A failed/deleted/incomplete profile is retried on the next signed-in visit. */ }
    }
}
