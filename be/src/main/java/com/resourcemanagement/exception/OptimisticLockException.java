package com.resourcemanagement.exception;

public class OptimisticLockException extends BaseException {
    public OptimisticLockException() {
        super("Data was modified by another user. Please retry.", "OPTIMISTIC_LOCK", 409);
    }
}
