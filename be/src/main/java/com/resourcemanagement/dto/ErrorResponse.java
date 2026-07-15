package com.resourcemanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private boolean success;
    private String message;
    private String errorCode;
    private int status;

    @Builder.Default
    private Instant timestamp = Instant.now();

    // Field-level errors (cho validation fail)
    private Map<String, String> errors;

    public static ErrorResponse of(int status, String message, String errorCode) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .message(message)
                .errorCode(errorCode)
                .build();
    }

    public static ErrorResponse of(int status, String message, String errorCode, Map<String, String> errors) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .message(message)
                .errorCode(errorCode)
                .errors(errors)
                .build();
    }
}
