# Phase 5 — DTO

> Mục tiêu: tạo Request/Response DTO records với validation annotations.

---

## Việc cần làm

### 1. Tạo package `dto`

```
be/src/main/java/com/resourcemanagement/dto/
  ├── request/
  │   ├── EmployeeRequest.java
  │   ├── ProjectRequest.java
  │   └── AllocationRequest.java
  └── response/
      ├── EmployeeResponse.java
      ├── ProjectResponse.java
      ├── AllocationResponse.java
      ├── WorkloadResponse.java
      ├── EmployeeUtilizationDTO.java
      └── AllocationDetailDTO.java
```

(DTO `ApiResponse` và `ErrorResponse` đã tạo ở Phase 4, nằm trong `dto/`)

### 2. Request DTOs

**`EmployeeRequest.java`**

```java
package com.resourcemanagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record EmployeeRequest(
    @NotBlank(message = "Employee code is required")
    @Pattern(regexp = "^[A-Z0-9]{3,20}$", message = "Employee code must be 3-20 uppercase alphanumeric characters")
    String employeeCode,

    @NotBlank(message = "Full name is required")
    String fullName,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Role is required")
    String role,

    @NotBlank(message = "Department is required")
    String department
) {}
```

**`ProjectRequest.java`**

```java
package com.resourcemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ProjectRequest(
    @NotBlank(message = "Project code is required")
    String projectCode,

    @NotBlank(message = "Project name is required")
    String projectName,

    @NotBlank(message = "Customer is required")
    String customer,

    @NotNull(message = "Status is required")
    String status,

    @NotNull(message = "Start date is required")
    LocalDate startDate,

    LocalDate endDate
) {}
```

**`AllocationRequest.java`**

```java
package com.resourcemanagement.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record AllocationRequest(
    @NotNull(message = "Employee ID is required")
    Long employeeId,

    @NotNull(message = "Project ID is required")
    Long projectId,

    @NotNull(message = "Allocation percent is required")
    @Min(value = 1, message = "Allocation must be at least 1%")
    @Max(value = 100, message = "Allocation must not exceed 100%")
    Integer allocationPercent,

    String roleInProject,

    @NotNull(message = "Start date is required")
    LocalDate startDate,

    @NotNull(message = "End date is required")
    LocalDate endDate
) {}
```

### 3. Response DTOs

**`EmployeeResponse.java`**

```java
package com.resourcemanagement.dto.response;

import java.time.LocalDateTime;

public record EmployeeResponse(
    Long employeeId,
    String employeeCode,
    String fullName,
    String email,
    String role,
    String department,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

**`ProjectResponse.java`**

```java
package com.resourcemanagement.dto.response;

import com.resourcemanagement.model.enums.ProjectStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProjectResponse(
    Long projectId,
    String projectCode,
    String projectName,
    String customer,
    ProjectStatus status,
    LocalDate startDate,
    LocalDate endDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

**`AllocationResponse.java`**

```java
package com.resourcemanagement.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AllocationResponse(
    Long allocationId,
    Long employeeId,
    String employeeName,
    Long projectId,
    String projectName,
    String projectCode,
    Integer allocationPercent,
    String roleInProject,
    LocalDate startDate,
    LocalDate endDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

**`AllocationDetailDTO.java`**

```java
package com.resourcemanagement.dto.response;

import java.time.LocalDate;

public record AllocationDetailDTO(
    Long allocationId,
    String projectName,
    String projectCode,
    Integer allocationPercent,
    String roleInProject,
    LocalDate startDate,
    LocalDate endDate
) {}
```

**`WorkloadResponse.java`**

```java
package com.resourcemanagement.dto.response;

import java.util.List;

public record WorkloadResponse(
    Long employeeId,
    String employeeName,
    Integer totalAllocation,
    Integer available,
    List<AllocationDetailDTO> allocations
) {}
```

**`EmployeeUtilizationDTO.java`**

```java
package com.resourcemanagement.dto.response;

public record EmployeeUtilizationDTO(
    Long employeeId,
    String fullName,
    int totalAllocation,
    int available
) {

    public EmployeeUtilizationDTO(Long employeeId, String fullName, int totalAllocation) {
        this(employeeId, fullName, totalAllocation, 100 - totalAllocation);
    }
}
```

---

## Kết quả sau phase 5

- 3 request records với đầy đủ validation annotations
- 6 response records cho từng endpoint
- `AllocationResponse` gộp thông tin employee + project để tránh N+1 khi FE render
- `WorkloadResponse` chứa list `AllocationDetailDTO` + tổng + available
- Build thành công `mvn compile`
