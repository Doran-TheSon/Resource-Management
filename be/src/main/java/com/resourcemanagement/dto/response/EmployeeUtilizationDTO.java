package com.resourcemanagement.dto.response;

public record EmployeeUtilizationDTO(
    Long employeeId,
    String fullName,
    int totalAllocation,
    int available
) {

    public EmployeeUtilizationDTO(Long employeeId, String fullName, int totalAllocation) {
        this(employeeId, fullName, totalAllocation, 100 - totalAllocation);
    }
}
