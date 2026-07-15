package com.resourcemanagement.exception;

public class ProjectCompletedException extends BaseException {
    public ProjectCompletedException(String projectName) {
        super("Project " + projectName + " is completed. Cannot allocate.", "PROJECT_COMPLETED", 400);
    }
}
