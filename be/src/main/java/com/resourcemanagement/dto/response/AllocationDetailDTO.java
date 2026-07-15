package com.resourcemanagement.dto.response;

import java.time.LocalDate;

public record AllocationDetailDTO(
    Long allocationId,
    String projectName,
    String projectCode,
    Integer allocationPercent,
    String roleInProject,
    LocalDate startDate,
    LocalDate endDate
) {}
