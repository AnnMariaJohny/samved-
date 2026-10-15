package io.samved.common;


/** Keeps the server bootable until the profile module is integrated, without inventing student data. */
public class PendingStudentProfilePort implements StudentProfilePort {
    @Override public StudentSnapshot snapshot(long studentId) {
        throw ApiException.serviceUnavailable("Student profile service is not connected yet.");
    }
}
