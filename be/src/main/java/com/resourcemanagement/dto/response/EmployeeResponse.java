package com.resourcemanagement.dto.response;

import java.time.LocalDateTime;

public record EmployeeResponse(
    Long employeeId,
    String employeeCode,
    String fullName,
    String email,
    String role,
    String department,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
