package com.resourcemanagement.exception;

public class AllocationExceededException extends BaseException {
    public AllocationExceededException(String message) {
        super(message, "ALLOCATION_EXCEEDED", 400);
    }
}
