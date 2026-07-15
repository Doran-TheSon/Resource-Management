package com.resourcemanagement.exception;

public class AllocationNotFoundException extends BaseException {
    public AllocationNotFoundException(Long id) {
        super("Allocation not found with id: " + id, "ALLOCATION_NOT_FOUND", 404);
    }
}
