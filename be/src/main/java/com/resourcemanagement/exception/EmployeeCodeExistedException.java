package com.resourcemanagement.exception;

public class EmployeeCodeExistedException extends BaseException {
    public EmployeeCodeExistedException(String code) {
        super("Employee code already exists: " + code, "EMPLOYEE_CODE_EXISTED", 409);
    }
}
