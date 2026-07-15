package com.resourcemanagement.exception;

import com.resourcemanagement.dto.ErrorResponse;
import jakarta.persistence.OptimisticLockException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Xử lý custom exceptions (BaseException)
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex) {
        log.warn("Business error: {} — {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity
                .status(ex.getStatus())
                .body(ErrorResponse.of(ex.getStatus(), ex.getMessage(), ex.getErrorCode()));
    }

    // Validation errors (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                errors.put(err.getField(), err.getDefaultMessage())
        );
        log.warn("Validation failed: {}", errors);
        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(400, "Validation failed", "VALIDATION_ERROR", errors));
    }

    // Optimistic lock conflict
    @ExceptionHandler(OptimisticLockException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(OptimisticLockException ex) {
        log.warn("Optimistic lock conflict");
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(409,
                        "Data was modified by another user. Please retry.",
                        "CONCURRENT_MODIFICATION"));
    }

    // JSON parse error (ví dụ: gửi sai định dạng date)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Invalid request body: {}", ex.getMessage());
        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(400,
                        "Invalid request body. Check date format (yyyy-MM-dd) and JSON syntax.",
                        "MALFORMED_REQUEST"));
    }

    // Type mismatch — ví dụ: String "abc" vào @PathVariable Long
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.warn("Type mismatch: {} should be {}", ex.getName(), ex.getRequiredType());
        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(400,
                        "Invalid value for parameter '" + ex.getName() + "'. Expected type: " + (ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown"),
                        "TYPE_MISMATCH"));
    }

    // Fallback — tất cả exception chưa được xử lý riêng
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unexpected error: ", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(500,
                        "Internal server error. Please contact support.",
                        "INTERNAL_ERROR"));
    }
}
