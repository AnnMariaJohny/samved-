package io.samved.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Reads a server-side session value; request bodies and query strings cannot choose an owner. */
@Component
public class StudentContext {
    public static final String SESSION_STUDENT_ID = "samvedStudentId";
    private final HttpServletRequest request;

    public StudentContext(HttpServletRequest request) { this.request = request; }

    public long requireStudentId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw ApiException.unauthorized("Sign in to continue.");
        }
        HttpSession session = request.getSession(false);
        Object id = session == null ? null : session.getAttribute(SESSION_STUDENT_ID);
        if (!(id instanceof Long ownerId) || ownerId <= 0) {
            throw ApiException.unauthorized("Sign in to continue.");
        }
        return ownerId;
    }
}
