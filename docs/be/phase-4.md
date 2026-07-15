# Phase 4 — Exception & Response

> Mục tiêu: chuẩn hoá response format cho toàn bộ API — success cũng như error — để FE dựa vào đó mà parse mà không cần đoán.

---

## 1. Response format chuẩn

Tất cả response — success hay error — đều phải kèm **status code** trong body JSON, không chỉ ở HTTP header. FE có thể dựa vào `status` trong body để xử lý mà không cần đọc header.

### Success response

```json
{
  "success": true,
  "status": 200,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-07-15T10:30:00.000Z"
}
```

### Created response (POST)

```json
{
  "success": true,
  "status": 201,
  "data": { ... },
  "message": "Employee created successfully",
  "timestamp": "2026-07-15T10:30:00.000Z"
}
```

### Error response

```json
{
  "success": false,
  "status": 404,
  "message": "Employee not found with id: 99",
  "errorCode": "EMPLOYEE_NOT_FOUND",
  "timestamp": "2026-07-15T10:30:00.000Z"
}
```

### Validation error response

```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2026-07-15T10:30:00.000Z",
  "errors": {
    "fullName": "Full name is required",
    "email": "Invalid email format",
    "allocationPercent": "Allocation must be at least 1%"
  }
}
```

---

## 2. Việc cần làm

### a. Tạo `ApiResponse<T>`

`be/src/main/java/com/resourcemanagement/dto/ApiResponse.java`

```java
package com.resourcemanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private int status;
    private String message;
    private T data;

    @Builder.Default
    private Instant timestamp = Instant.now();

    // --- static factories cho success ---

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(200)
                .message("Operation successful")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(200)
                .message(message)
                .data(data)
                .build();
    }

    // Cho POST — 201 Created
    public static <T> ApiResponse<T> created(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(201)
                .message(message)
                .data(data)
                .build();
    }

    // Dành cho DELETE (không có data, không cần ApiResponse)
    // Ưu tiên dùng ResponseEntity.noContent().build() — trả về 204
}
```

### b. Tạo `ErrorResponse`

`be/src/main/java/com/resourcemanagement/dto/ErrorResponse.java`

```java
package com.resourcemanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private boolean success;
    private String message;
    private String errorCode;
    private int status;

    @Builder.Default
    private Instant timestamp = Instant.now();

    // Field-level errors (cho validation fail)
    private Map<String, String> errors;

    public static ErrorResponse of(int status, String message, String errorCode) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .message(message)
                .errorCode(errorCode)
                .build();
    }

    public static ErrorResponse of(int status, String message, String errorCode, Map<String, String> errors) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .message(message)
                .errorCode(errorCode)
                .errors(errors)
                .build();
    }
}
```

### c. Tạo custom exceptions

`be/src/main/java/com/resourcemanagement/exception/`

```java
package com.resourcemanagement.exception;

import lombok.Getter;

@Getter
public abstract class BaseException extends RuntimeException {
    private final String errorCode;
    private final int status;

    public BaseException(String message, String errorCode, int status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
}
```

| Exception | errorCode | status | Khi nào throw |
|-----------|-----------|--------|--------------|
| `EmployeeNotFoundException` | `EMPLOYEE_NOT_FOUND` | 404 | GET/PUT employee không tồn tại |
| `EmployeeCodeExistedException` | `EMPLOYEE_CODE_EXISTED` | 409 | Tạo employee với code đã có |
| `ProjectNotFoundException` | `PROJECT_NOT_FOUND` | 404 | GET/PUT project không tồn tại |
| `ProjectCodeExistedException` | `PROJECT_CODE_EXISTED` | 409 | Tạo project với code đã có |
| `AllocationNotFoundException` | `ALLOCATION_NOT_FOUND` | 404 | PUT/DELETE allocation không tồn tại |
| `AllocationExceededException` | `ALLOCATION_EXCEEDED` | 400 | Tổng allocation > 100% |
| `AllocationOverlapException` | `ALLOCATION_OVERLAP` | 409 | Trùng thời gian allocation |
| `ProjectCompletedException` | `PROJECT_COMPLETED` | 400 | Allocate vào COMPLETED project |
| `InvalidDateRangeException` | `INVALID_DATE_RANGE` | 400 | endDate < startDate |

### d. Tạo `GlobalExceptionHandler`

`be/src/main/java/com/resourcemanagement/exception/GlobalExceptionHandler.java`

```java
package com.resourcemanagement.exception;

import com.resourcemanagement.dto.ErrorResponse;
import jakarta.persistence.OptimisticLockException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Xử lý custom exceptions (BaseException)
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex) {
        log.warn("Business error: {} — {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity
                .status(ex.getStatus())
                .body(ErrorResponse.of(ex.getStatus(), ex.getMessage(), ex.getErrorCode()));
    }

    // Validation errors (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                errors.put(err.getField(), err.getDefaultMessage())
        );
        log.warn("Validation failed: {}", errors);
        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(400, "Validation failed", "VALIDATION_ERROR", errors));
    }

    // Optimistic lock conflict
    @ExceptionHandler(OptimisticLockException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(OptimisticLockException ex) {
        log.warn("Optimistic lock conflict");
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(409,
                        "Data was modified by another user. Please retry.",
                        "CONCURRENT_MODIFICATION"));
    }

    // JSON parse error (ví dụ: gửi sai định dạng date)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Invalid request body: {}", ex.getMessage());
        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(400,
                        "Invalid request body. Check date format (yyyy-MM-dd) and JSON syntax.",
                        "MALFORMED_REQUEST"));
    }

    // Fallback — tất cả exception chưa được xử lý riêng
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unexpected error: ", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(500,
                        "Internal server error. Please contact support.",
                        "INTERNAL_ERROR"));
    }
}
```

---

## 3. Danh sách HTTP status codes sử dụng

| Status | Dùng cho |
|--------|----------|
| 200 OK | GET, PUT thành công |
| 201 Created | POST thành công |
| 204 No Content | DELETE thành công |
| 400 Bad Request | Validation fail, business rule fail |
| 404 Not Found | Employee/Project/Allocation không tồn tại |
| 409 Conflict | Duplicate code, Optimistic Lock, Overlap allocation |
| 500 Internal Server Error | Lỗi không xác định |

---

## 4. Cách dùng trong Controller

```java
// GET — list
@GetMapping
public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAll() {
    List<EmployeeResponse> list = employeeService.findAll();
    return ResponseEntity.ok(ApiResponse.success(list));
}

// GET — single
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
    EmployeeResponse employee = employeeService.findById(id);
    return ResponseEntity.ok(ApiResponse.success(employee));
}

// POST — create
@PostMapping
public ResponseEntity<ApiResponse<EmployeeResponse>> create(@Valid @RequestBody EmployeeRequest request) {
    EmployeeResponse employee = employeeService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(employee, "Employee created successfully"));
}

// DELETE — trả về 204 No Content, không có body
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id) {
    employeeService.delete(id);
    return ResponseEntity.noContent().build();
}
```

---

## Kết quả sau phase 4

- `ApiResponse<T>` dùng chung cho mọi success response
- `ErrorResponse` cho error — có `errorCode` + field-level errors
- 9 custom exceptions cụ thể, mỗi exception một errorCode riêng
- `GlobalExceptionHandler` xử lý tất cả: validation, optimistic lock, business rules
- Build thành công `mvn compile`
