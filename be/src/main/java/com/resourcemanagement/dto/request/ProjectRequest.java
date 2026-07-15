package com.resourcemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ProjectRequest(
    @NotBlank(message = "Project code is required")
    String projectCode,

    @NotBlank(message = "Project name is required")
    String projectName,

    @NotBlank(message = "Customer is required")
    String customer,

    @NotNull(message = "Status is required")
    String status,

    @NotNull(message = "Start date is required")
    LocalDate startDate,

    LocalDate endDate
) {}
