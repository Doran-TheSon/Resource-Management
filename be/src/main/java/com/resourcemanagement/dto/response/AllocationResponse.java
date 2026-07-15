package com.resourcemanagement.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AllocationResponse(
    Long allocationId,
    Long employeeId,
    String employeeName,
    Long projectId,
    String projectName,
    String projectCode,
    Integer allocationPercent,
    String roleInProject,
    LocalDate startDate,
    LocalDate endDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
