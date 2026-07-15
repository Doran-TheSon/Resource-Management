package com.resourcemanagement.dto.response;

import java.util.List;

public record WorkloadResponse(
    Long employeeId,
    String employeeName,
    Integer totalAllocation,
    Integer available,
    List<AllocationDetailDTO> allocations
) {}
