package com.resourcemanagement.exception;

public class ProjectCompletedException extends BaseException {
    public ProjectCompletedException(String projectName) {
        super("Project is already completed: " + projectName, "PROJECT_COMPLETED", 400);
    }
}
