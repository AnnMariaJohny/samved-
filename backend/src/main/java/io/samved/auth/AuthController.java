package io.samved.auth;

import io.samved.common.StudentContext;
import io.samved.student.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AccountService accounts;
    private final ProfileService profiles;
    private final StudentContext student;
    private final SecurityContextRepository contexts;
    private final CsrfTokenRepository csrf;
    private final LoginThrottle throttle;
    public AuthController(AccountService accounts,ProfileService profiles,StudentContext student,
                          SecurityContextRepository contexts,CsrfTokenRepository csrf,LoginThrottle throttle) {
        this.accounts=accounts; this.profiles=profiles; this.student=student; this.contexts=contexts; this.csrf=csrf; this.throttle=throttle;
    }
    @GetMapping("/csrf") Map<String,String> csrf(CsrfToken token) { return Map.of("token",token.getToken()); }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    ProfileService.View register(@Valid @RequestBody AccountService.Registration input,HttpServletRequest request) {
        throttle.check(request.getRemoteAddr()); return profiles.view(accounts.register(input).id);
    }
    @PostMapping("/login")
    ProfileService.View login(@Valid @RequestBody AccountService.Login input,HttpServletRequest request,HttpServletResponse response) {
        throttle.check(request.getRemoteAddr());
        StudentProfile p=accounts.login(input);
        // Discard the anonymous/previous session, including its CSRF token and private attributes.
        if(request.getSession(false)!=null) request.getSession(false).invalidate();
        HttpSession session=request.getSession(true);
        session.setAttribute(StudentContext.SESSION_STUDENT_ID,p.id);
        session.setAttribute("samvedAccountId",p.account.id);
        session.setAttribute("samvedSessionVersion",p.account.sessionVersion);
        var context=SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(p.account.id.toString(),null,
            List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
        SecurityContextHolder.setContext(context); contexts.saveContext(context,request,response);
        csrf.saveToken(null,request,response);
        return profiles.view(p.id);
    }
    @GetMapping("/me") ProfileService.View me() { return profiles.view(student.requireStudentId()); }
    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(HttpServletRequest request,HttpServletResponse response) { endSession(request,response); }
    @PutMapping("/password") @ResponseStatus(HttpStatus.NO_CONTENT)
    void password(@Valid @RequestBody AccountService.PasswordChange input,HttpServletRequest request,HttpServletResponse response) {
        long version=accounts.changePassword(student.requireStudentId(),input);
        request.changeSessionId(); request.getSession().setAttribute("samvedSessionVersion",version);
        csrf.saveToken(null,request,response);
    }
    public static void endSession(HttpServletRequest request,HttpServletResponse response) {
        if(request.getSession(false)!=null) request.getSession(false).invalidate();
        SecurityContextHolder.clearContext();
        Cookie cookie=new Cookie("JSESSIONID",""); cookie.setPath("/"); cookie.setMaxAge(0); cookie.setHttpOnly(true);
        cookie.setSecure(request.isSecure()); response.addCookie(cookie);
    }
}
