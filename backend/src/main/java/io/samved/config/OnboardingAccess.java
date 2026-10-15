package io.samved.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.roadmap.PersonalRoadmapService;
import jakarta.servlet.http.*;
import java.util.Map;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.*;

/** Enforce onboarding at the server boundary, including direct feature-page requests. */
@Configuration
public class OnboardingAccess implements WebMvcConfigurer {
    private final PersonalRoadmapService roadmaps;
    private final ObjectMapper json;
    public OnboardingAccess(PersonalRoadmapService roadmaps,ObjectMapper json) {this.roadmaps=roadmaps;this.json=json;}
    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler) throws Exception {
                String path=org.springframework.web.util.UrlPathHelper.defaultInstance.getPathWithinApplication(request);
                boolean api=path.startsWith("/api/v1/");
                boolean setup=path.equals("/api/v1/students/me")||path.startsWith("/api/v1/students/me/")
                    ||path.startsWith("/api/v1/auth/")||path.startsWith("/api/v1/assessments/");
                boolean page=!api&&(path.endsWith(".html")||path.endsWith("/"))
                    &&!path.equals("/")&&!path.equals("/index.html")&&!path.startsWith("/auth/");
                if((!api&&!page)||setup)return true;
                var auth=SecurityContextHolder.getContext().getAuthentication();
                if(auth==null||!auth.isAuthenticated()||auth instanceof AnonymousAuthenticationToken) {
                    if(page){response.sendRedirect("/auth/login.html");return false;}
                    return true; // Spring Security handles unauthenticated API requests.
                }
                if(page&&(path.startsWith("/profile/")||path.startsWith("/assessment/")))return true;
                var state=roadmaps.checklist();
                if(state.ready())return true;
                String next=state.sections().stream().filter(step->!step.complete()).findFirst().orElseThrow().href();
                response.setHeader("Cache-Control","no-store");
                if(page)response.sendRedirect(next);
                else {
                    response.setStatus(403);response.setContentType("application/json");
                    json.writeValue(response.getWriter(),Map.of("code","ONBOARDING_REQUIRED","message",
                        "Complete all profile sections and the career assessment before using SAMVED.","nextPath",next));
                }
                return false;
            }
        }).addPathPatterns("/**");
    }
}
