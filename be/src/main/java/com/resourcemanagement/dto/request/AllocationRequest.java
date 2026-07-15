package com.resourcemanagement.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record AllocationRequest(
    @NotNull(message = "Employee ID is required")
    Long employeeId,

    @NotNull(message = "Project ID is required")
    Long projectId,

    @NotNull(message = "Allocation percent is required")
    @Min(value = 1, message = "Allocation must be at least 1%")
    @Max(value = 100, message = "Allocation must not exceed 100%")
    Integer allocationPercent,

    String roleInProject,

    @NotNull(message = "Start date is required")
    LocalDate startDate,

    @NotNull(message = "End date is required")
    LocalDate endDate
) {}
