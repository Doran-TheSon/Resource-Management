package com.resourcemanagement.exception;

public class ProjectCodeExistedException extends BaseException {
    public ProjectCodeExistedException(String code) {
        super("Project code already exists: " + code, "PROJECT_CODE_EXISTED", 409);
    }
}
