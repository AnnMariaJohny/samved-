package io.samved.notification;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Enables the hourly in-app reminder scan. */
@Configuration
@EnableScheduling
public class ReminderScheduling {}
