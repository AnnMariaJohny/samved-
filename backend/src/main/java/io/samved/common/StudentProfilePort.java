package io.samved.common;

/** Christa implements this interface using only the authenticated student's persisted profile. */
public interface StudentProfilePort {
    StudentSnapshot snapshot(long studentId);
}
