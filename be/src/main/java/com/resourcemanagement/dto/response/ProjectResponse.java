package com.resourcemanagement.dto.response;

import com.resourcemanagement.model.enums.ProjectStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProjectResponse(
    Long projectId,
    String projectCode,
    String projectName,
    String customer,
    ProjectStatus status,
    LocalDate startDate,
    LocalDate endDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
