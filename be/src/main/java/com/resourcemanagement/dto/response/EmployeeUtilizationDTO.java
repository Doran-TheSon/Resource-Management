package com.resourcemanagement.dto.response;

public record EmployeeUtilizationDTO(
    Long employeeId,
    String fullName,
    int totalAllocation,
    int available
) {

    private static final int MAX_ALLOCATION = 100;

    public EmployeeUtilizationDTO(Long employeeId, String fullName, int totalAllocation) {
        this(employeeId, fullName, totalAllocation, MAX_ALLOCATION - totalAllocation);
    }
}
