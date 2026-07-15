package com.resourcemanagement.exception;

public class InvalidDateRangeException extends BaseException {
    public InvalidDateRangeException(String message) {
        super(message, "INVALID_DATE_RANGE", 400);
    }
}
