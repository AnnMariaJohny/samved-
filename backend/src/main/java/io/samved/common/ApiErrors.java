package io.samved.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Consistent errors let the frontend show useful validation messages. */
@RestControllerAdvice
public class ApiErrors {
    public record ErrorBody(String code, String message, Map<String, String> fieldErrors, String requestId) { }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorBody> api(ApiException error, HttpServletRequest request) {
        return ResponseEntity.status(error.status()).body(new ErrorBody(error.code(), error.getMessage(), Map.of(), requestId(request)));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorBody> invalid(MethodArgumentNotValidException error, HttpServletRequest request) {
        Map<String, String> fields = error.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(field -> field.getField(), field -> String.valueOf(field.getDefaultMessage()), (first, ignored) -> first));
        return ResponseEntity.badRequest().body(new ErrorBody("INVALID_REQUEST", "Check the marked fields.", fields, requestId(request)));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, ConstraintViolationException.class, org.springframework.web.method.annotation.HandlerMethodValidationException.class})
    ResponseEntity<ErrorBody> malformed(Exception ignored, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(new ErrorBody("INVALID_REQUEST", "The request is invalid.", Map.of(), requestId(request)));
    }

    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    ResponseEntity<ErrorBody> conflict(Exception error,HttpServletRequest request) {
        return ResponseEntity.status(409).body(new ErrorBody("CONFLICT","Your profile changed in another tab. Reload and try again.",Map.of(),requestId(request)));
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    ResponseEntity<ErrorBody> notFound(Exception error,HttpServletRequest request) {
        return ResponseEntity.status(404).body(new ErrorBody("NOT_FOUND","This page or endpoint does not exist.",Map.of(),requestId(request)));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorBody> unexpected(Exception error, HttpServletRequest request) {
        // Never echo database, stack trace, or personal data to the browser.
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorBody("SERVER_ERROR", "Something went wrong.", Map.of(), requestId(request)));
    }

    private String requestId(HttpServletRequest request) {
        Object id = request.getAttribute("samvedRequestId");
        return id == null ? UUID.randomUUID().toString() : id.toString();
    }
}
