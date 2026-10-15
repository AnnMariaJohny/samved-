package io.samved.common;

import java.util.List;

/** Read-only contract from Christa's profile module to Developer A's guidance modules. */
public record StudentSnapshot(
    String educationLevel,
    String goalType,
    String goalText,
    List<String> interests,
    List<String> skills,
    List<String> strengths,
    List<String> values
) { }
