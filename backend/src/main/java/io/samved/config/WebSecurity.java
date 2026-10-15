package io.samved.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/** Same-origin session authentication; CSRF is required even for login and registration. */
@Configuration
public class WebSecurity {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authorize -> authorize
            .requestMatchers("/api/v1/auth/csrf", "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/logout").permitAll()
            .requestMatchers("/api/v1/**").authenticated()
            .anyRequest().permitAll());
        http.csrf(csrf -> csrf.csrfTokenRepository(csrfRepository()));
        http.securityContext(context -> context.securityContextRepository(contextRepository()));
        http.logout(AbstractHttpConfigurer::disable);
        http.httpBasic(AbstractHttpConfigurer::disable);
        http.formLogin(AbstractHttpConfigurer::disable);
        http.exceptionHandling(errors -> errors
            .authenticationEntryPoint((request, response, error) -> jsonError(response, 401, "Sign in to continue."))
            .accessDeniedHandler((request, response, error) -> jsonError(response, 403, "Your security token has expired. Refresh the page and try again.")));
        return http.build();
    }

    @Bean org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
    @Bean org.springframework.security.web.context.SecurityContextRepository contextRepository() {
        return new org.springframework.security.web.context.HttpSessionSecurityContextRepository();
    }
    @Bean org.springframework.security.web.csrf.CsrfTokenRepository csrfRepository() {
        var repository = new org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository();
        repository.setHeaderName("X-CSRF-TOKEN");
        return repository;
    }
    private static void jsonError(jakarta.servlet.http.HttpServletResponse response,int status,String message) throws java.io.IOException {
        response.setStatus(status); response.setContentType("application/json");
        response.getWriter().write("{\"code\":\"ACCESS_DENIED\",\"message\":\""+message+"\",\"fieldErrors\":{}}");
    }
}
