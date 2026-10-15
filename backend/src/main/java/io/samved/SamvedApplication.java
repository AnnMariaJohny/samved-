package io.samved;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Entry point for SAMVED's single Java backend. */
@SpringBootApplication
public class SamvedApplication {
    public static void main(String[] args) {
        SpringApplication.run(SamvedApplication.class, args);
    }
}
