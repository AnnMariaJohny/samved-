package io.samved.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.assessment.AssessmentService;
import io.samved.common.*;
import io.samved.student.*;
import io.samved.notification.TaskNotificationService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActionPlanService {
    public static final ZoneId ZONE=ZoneId.of("Asia/Kolkata");
    public record View(String goal,String source,String summary,Instant generatedAt,LocalDate throughDate,LocalDate today) { }
    private final StudentActionPlanRepository plans;
    private final StudentProfileRepository students;
    private final ProfileService profiles;
    private final AssessmentService assessment;
    private final LearningTaskRepository tasks;
    private final TaskNotificationService notifications;
    private final AiActionPlanner ai;
    private final ObjectMapper json;
    public ActionPlanService(StudentActionPlanRepository plans,StudentProfileRepository students,ProfileService profiles,
        AssessmentService assessment,LearningTaskRepository tasks,TaskNotificationService notifications,AiActionPlanner ai,ObjectMapper json) {
        this.plans=plans;this.students=students;this.profiles=profiles;this.assessment=assessment;this.tasks=tasks;this.notifications=notifications;this.ai=ai;this.json=json;
    }
    @Transactional
    public View ensure(long owner) {
        // Serialize only this student's refreshes, including separate tabs and the nightly job.
        var stored=students.lockForPlan(owner).orElseThrow(()->ApiException.notFound("Student not found"));
        var p=profiles.view(stored);var result=assessment.resultForStudent(owner);
        if(p.academics().isEmpty()||p.interests().isEmpty()||p.skills().isEmpty()||p.strengths().isEmpty()||p.values().isEmpty()
            ||("EXPLORING".equals(p.careerGoal().type())&&!p.reviewedSections().contains("career")))
            throw ApiException.badRequest("Complete onboarding before creating your daily plan.");
        LocalDate today=LocalDate.now(ZONE);
        String fingerprint=fingerprint(p,result);
        var saved=plans.findById(owner).orElse(null);
        if(saved!=null&&saved.fingerprint.equals(fingerprint)&&!saved.throughDate.isBefore(today))return view(saved,today);
        boolean changed=saved!=null&&!saved.fingerprint.equals(fingerprint);
        String goal=!"EXPLORING".equals(p.careerGoal().type())&&p.careerGoal().text()!=null?p.careerGoal().text():"Explore "+p.interests().get(0);
        var draft=ai.generate(p,result.leadingDimensions(),goal);
        // Keep completed, overdue, in-progress and student-edited work. Retire only superseded future pending assignments.
        if(changed)for(var task:tasks.findByStudentIdOrderByCreatedAtDesc(owner)) {
            if(task.getAutoPlanKey()!=null&&task.getStatus()==TaskStatus.PENDING&&task.getDueDate()!=null&&!task.getDueDate().isBefore(today)) {
                notifications.clearForTask(task);tasks.delete(task);
            }
        }
        String key=UUID.randomUUID().toString();
        for(int i=0;i<draft.steps().size();i++) {
            var step=draft.steps().get(i);
            var task=new LearningTask(owner,null,null,step.title(),step.description()+"\nEstimated time: "+step.minutes()+" minutes. · "+(draft.source().equals("AI")?"AI-personalised":"Guided starter")+" assignment for "+goal,today.plusDays(i));
            task.setAutoPlanKey(key);tasks.save(task);
        }
        if(saved==null){saved=new StudentActionPlan();saved.studentId=owner;}
        saved.fingerprint=fingerprint;saved.goal=goal;saved.source=draft.source();saved.summary=draft.summary();saved.generatedAt=Instant.now();saved.throughDate=today.plusDays(6);
        plans.saveAndFlush(saved);return view(saved,today);
    }
    private String fingerprint(ProfileService.View p,AssessmentService.Result result) {
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsString(List.of(
            "action-plan-v1",p.educationLevel(),p.careerGoal(),p.interests(),p.skills(),p.strengths(),p.values(),p.academics(),new TreeMap<>(result.dimensionCounts())))
            .getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}
    }
    private View view(StudentActionPlan p,LocalDate today){return new View(p.goal,p.source,p.summary,p.generatedAt,p.throughDate,today);}
}
