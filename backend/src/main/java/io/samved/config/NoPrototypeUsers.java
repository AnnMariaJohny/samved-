package io.samved.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/** Prevents Spring Boot from creating and logging an unintended demo login. */
@Configuration
public class NoPrototypeUsers {
    @Bean
    @ConditionalOnMissingBean(UserDetailsService.class)
    UserDetailsService noPrototypeUserDetails() {
        return username -> { throw new UsernameNotFoundException("No account service is connected yet."); };
    }
}
