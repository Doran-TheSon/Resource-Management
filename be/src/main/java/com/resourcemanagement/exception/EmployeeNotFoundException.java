package com.resourcemanagement.exception;

public class EmployeeNotFoundException extends BaseException {
    public EmployeeNotFoundException(Long id) {
        super("Employee not found with id: " + id, "EMPLOYEE_NOT_FOUND", 404);
    }
}
