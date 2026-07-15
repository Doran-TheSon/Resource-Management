package com.resourcemanagement.exception;

public class AllocationOverlapException extends BaseException {
    public AllocationOverlapException(String message) {
        super(message, "ALLOCATION_OVERLAP", 409);
    }
}
