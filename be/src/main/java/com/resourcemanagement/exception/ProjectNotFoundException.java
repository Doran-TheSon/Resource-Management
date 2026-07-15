package com.resourcemanagement.exception;

public class ProjectNotFoundException extends BaseException {
    public ProjectNotFoundException(Long id) {
        super("Project not found with id: " + id, "PROJECT_NOT_FOUND", 404);
    }
}
