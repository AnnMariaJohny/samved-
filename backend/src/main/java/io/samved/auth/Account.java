package io.samved.auth;

import jakarta.persistence.*;
import java.time.Instant;

/** Credentials never leave the account service. */
@Entity
@Table(name = "users")
public class Account {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable = false, unique = true, length = 254) public String email;
    @Column(name = "password_hash", nullable = false, length = 100) public String passwordHash;
    @Column(name = "accepted_at", nullable = false) public Instant acceptedAt;
    @Column(name = "privacy_version", nullable = false, length = 30) public String privacyVersion;
    @Column(name = "session_version", nullable = false) public long sessionVersion;
    public Account() { }
}
