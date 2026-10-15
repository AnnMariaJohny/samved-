package io.samved.auth;

import io.samved.common.*;
import io.samved.student.*;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AccountService {
    public record Registration(@NotBlank @Email @Size(max=254) String email,
        @NotBlank @Size(min=8,max=72) String password, @NotBlank @Size(max=100) String name,
        @NotBlank String educationLevel, @NotNull @Size(max=100) String cityRegion,
        @AssertTrue boolean adultConfirmed, @AssertTrue boolean privacyAccepted) { }
    public record Login(@NotBlank @Email @Size(max=254) String email, @NotBlank @Size(max=72) String password) { }
    public record PasswordChange(@NotBlank @Size(max=72) String currentPassword,
                                 @NotBlank @Size(min=8,max=72) String newPassword) { }
    private final AccountRepository accounts;
    private final StudentProfileRepository profiles;
    private final PasswordEncoder passwords;
    private final DeveloperADataDeletion deletion;
    private final String dummyHash;
    public AccountService(AccountRepository accounts, StudentProfileRepository profiles,
                          PasswordEncoder passwords, DeveloperADataDeletion deletion) {
        this.accounts=accounts; this.profiles=profiles; this.passwords=passwords; this.deletion=deletion;
        dummyHash=passwords.encode(java.util.UUID.randomUUID().toString());
    }
    public StudentProfile register(Registration r) {
        ProfileService.education(r.educationLevel()); strongPassword(r.password());
        String email=normalize(r.email());
        if(accounts.findByEmail(email).isPresent()) throw ApiException.conflict("An account with this email already exists. Try signing in.");
        Account a=new Account(); a.email=email; a.passwordHash=passwords.encode(r.password());
        a.acceptedAt=Instant.now(); a.privacyVersion="local-pilot-2026-10-15";
        try {
            accounts.saveAndFlush(a);
            StudentProfile p=new StudentProfile(); p.account=a; p.name=r.name().trim();
            p.educationLevel=r.educationLevel(); p.cityRegion=r.cityRegion().trim();
            return profiles.saveAndFlush(p);
        } catch(DataIntegrityViolationException e) { throw ApiException.conflict("An account with this email already exists. Try signing in."); }
    }
    public StudentProfile login(Login input) {
        Account a=accounts.findByEmail(normalize(input.email())).orElse(null);
        boolean matches=passwords.matches(input.password(),a==null?dummyHash:a.passwordHash);
        if(a==null || !matches) throw ApiException.unauthorized("Email or password is incorrect.");
        return profiles.findByAccountId(a.id).orElseThrow(() -> ApiException.unauthorized("Account profile is unavailable."));
    }
    public long changePassword(long profileId,PasswordChange input) {
        Account a=profiles.findById(profileId).orElseThrow(() -> ApiException.unauthorized("Sign in again.")).account;
        if(!passwords.matches(input.currentPassword(),a.passwordHash)) throw ApiException.unauthorized("Current password is incorrect.");
        strongPassword(input.newPassword()); a.passwordHash=passwords.encode(input.newPassword());
        a.sessionVersion++; accounts.saveAndFlush(a); return a.sessionVersion;
    }
    public void delete(long profileId) {
        StudentProfile p=profiles.findById(profileId).orElseThrow(() -> ApiException.unauthorized("Sign in again."));
        deletion.deleteForStudent(profileId);
        Account a=p.account; profiles.delete(p); profiles.flush(); accounts.delete(a); accounts.flush();
    }
    private static String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private static void strongPassword(String value) {
        if(value.getBytes(StandardCharsets.UTF_8).length>72 || !value.matches("(?s)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,72}"))
            throw ApiException.badRequest("Use 8–72 characters with uppercase, lowercase, a number and a special character (maximum 72 UTF-8 bytes).");
    }
}
