package io.samved.student;

import io.samved.auth.*;
import io.samved.common.StudentContext;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import io.samved.student.ProfileService.Skill;
import io.samved.student.ProfileService.Academic;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController @Validated @RequestMapping("/api/v1/students/me")
public class StudentController {
    private final ProfileService profiles; private final StudentContext student; private final AccountService accounts;
    public StudentController(ProfileService profiles,StudentContext student,AccountService accounts) { this.profiles=profiles; this.student=student; this.accounts=accounts; }
    @GetMapping ProfileService.View me() { return profiles.view(student.requireStudentId()); }
    @PutMapping ProfileService.View save(@Valid @RequestBody ProfileService.Details input) { return profiles.update(student.requireStudentId(),input); }
    @PutMapping("/review/{section}") ProfileService.View review(@PathVariable String section) { return profiles.review(student.requireStudentId(),section); }
    @DeleteMapping @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(HttpServletRequest request,HttpServletResponse response) { accounts.delete(student.requireStudentId()); AuthController.endSession(request,response); }
    @GetMapping("/{section:interests|strengths|values}") List<String> list(@PathVariable String section) { return profiles.selections(student.requireStudentId(),section); }
    @PutMapping("/{section:interests|strengths|values}") List<String> saveList(@PathVariable String section,@RequestBody List<String> input) { return profiles.saveSelections(student.requireStudentId(),section,input); }
    @GetMapping("/skills") List<ProfileService.Skill> skills() { return profiles.skills(student.requireStudentId()); }
    @PutMapping("/skills") List<Skill> skills(@RequestBody @Size(max=50) List<@NotNull @Valid Skill> input) { return profiles.saveSkills(student.requireStudentId(),input); }
    @GetMapping("/academics") List<ProfileService.Academic> academics() { return profiles.academics(student.requireStudentId()); }
    @PutMapping("/academics") List<Academic> academics(@RequestBody @Size(max=10) List<@NotNull @Valid Academic> input) { return profiles.saveAcademics(student.requireStudentId(),input); }
}
