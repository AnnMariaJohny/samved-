package io.samved.config;

import io.samved.common.PendingStudentProfilePort;
import io.samved.common.StudentProfilePort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The pending adapter is used only until Christa supplies a real profile port bean. */
@Configuration
public class StudentPorts {
    @Bean
    @ConditionalOnMissingBean(StudentProfilePort.class)
    StudentProfilePort pendingStudentProfilePort() {
        return new PendingStudentProfilePort();
    }
}
