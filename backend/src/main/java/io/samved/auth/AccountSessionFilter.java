package io.samved.auth;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Deleted accounts and sessions preceding a password change cannot keep using private APIs. */
@Component
public class AccountSessionFilter extends OncePerRequestFilter {
    private final AccountRepository accounts;
    public AccountSessionFilter(AccountRepository accounts) { this.accounts=accounts; }
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        HttpSession session=request.getSession(false);
        if(session!=null && session.getAttribute("samvedAccountId") instanceof Long id) {
            Account account=accounts.findById(id).orElse(null);
            Object version=session.getAttribute("samvedSessionVersion");
            if(account==null || !(version instanceof Long v) || v!=account.sessionVersion) {
                AuthController.endSession(request,response);
                if(request.getRequestURI().startsWith("/api/v1/") && !request.getRequestURI().equals("/api/v1/auth/csrf")) {
                    response.setStatus(401); response.setContentType("application/json");
                    response.getWriter().write("{\"message\":\"Your session has ended. Sign in again.\"}"); return;
                }
            }
        }
        chain.doFilter(request,response);
    }
}
