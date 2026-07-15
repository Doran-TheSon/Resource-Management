# Phase 7 — Controller Layer

> Mục tiêu: tạo REST controllers, mapping endpoints, trả về ApiResponse chuẩn.

---

## Việc cần làm

### 1. Cập nhật `WebConfig.java` — thêm prefix `/api/v1`

Để tất cả API đều có base path `/api/v1`, thêm thuộc tính vào `application.yml`:

```yaml
server:
  servlet:
    context-path: /api/v1
```

Hoặc dùng `server.servlet.context-path=/api/v1` — cách này gọn nhất.

**Hoặc** dùng `@RequestMapping("/api/v1/...")` trên từng controller. Tuỳ chọn.

### 2. `EmployeeController`

`be/src/main/java/com/resourcemanagement/controller/EmployeeController.java`

```java
package com.resourcemanagement.controller;

import com.resourcemanagement.dto.ApiResponse;
import com.resourcemanagement.dto.request.EmployeeRequest;
import com.resourcemanagement.dto.response.EmployeeResponse;
import com.resourcemanagement.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String role) {
        List<EmployeeResponse> list = employeeService.findAll(page, size, department, role);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        EmployeeResponse employee = employeeService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(@Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse employee = employeeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(employee, "Employee created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse employee = employeeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(employee, "Employee updated successfully"));
    }

    // LƯU Ý: Employee DELETE không nằm trong requirement section 3.1
    // Nếu cần, implement sau — ưu tiên các endpoint đã quy định
}
```

### 3. `ProjectController`

`be/src/main/java/com/resourcemanagement/controller/ProjectController.java`

```java
package com.resourcemanagement.controller;

import com.resourcemanagement.dto.ApiResponse;
import com.resourcemanagement.dto.request.ProjectRequest;
import com.resourcemanagement.dto.response.ProjectResponse;
import com.resourcemanagement.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customer) {
        List<ProjectResponse> list = projectService.findAll(page, size, status, customer);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getById(@PathVariable Long id) {
        ProjectResponse project = projectService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> create(@Valid @RequestBody ProjectRequest request) {
        ProjectResponse project = projectService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(project, "Project created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request) {
        ProjectResponse project = projectService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(project, "Project updated successfully"));
    }
}
```

### 4. `AllocationController`

`be/src/main/java/com/resourcemanagement/controller/AllocationController.java`

```java
package com.resourcemanagement.controller;

import com.resourcemanagement.dto.ApiResponse;
import com.resourcemanagement.dto.request.AllocationRequest;
import com.resourcemanagement.dto.response.AllocationResponse;
import com.resourcemanagement.service.AllocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/allocations")
@RequiredArgsConstructor
public class AllocationController {

    private final AllocationService allocationService;

    @PostMapping
    public ResponseEntity<ApiResponse<AllocationResponse>> create(@Valid @RequestBody AllocationRequest request) {
        AllocationResponse allocation = allocationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(allocation, "Allocation created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AllocationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AllocationRequest request) {
        AllocationResponse allocation = allocationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(allocation, "Allocation updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        allocationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### 5. `WorkloadController`

`be/src/main/java/com/resourcemanagement/controller/WorkloadController.java`

```java
package com.resourcemanagement.controller;

import com.resourcemanagement.dto.ApiResponse;
import com.resourcemanagement.dto.response.WorkloadResponse;
import com.resourcemanagement.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WorkloadController {

    private final AllocationService allocationService;

    @GetMapping("/employees/{id}/workload")
    public ResponseEntity<ApiResponse<WorkloadResponse>> getWorkload(@PathVariable Long id) {
        WorkloadResponse workload = allocationService.getWorkload(id);
        return ResponseEntity.ok(ApiResponse.success(workload));
    }
}
```

### 6. `ReportController`

`be/src/main/java/com/resourcemanagement/controller/ReportController.java`

```java
package com.resourcemanagement.controller;

import com.resourcemanagement.dto.ApiResponse;
import com.resourcemanagement.dto.response.EmployeeUtilizationDTO;
import com.resourcemanagement.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final AllocationService allocationService;

    @GetMapping("/utilization")
    public ResponseEntity<ApiResponse<List<EmployeeUtilizationDTO>>> getUtilization() {
        List<EmployeeUtilizationDTO> report = allocationService.getUtilizationReport();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    // Mapping theo requirement-analysis section 4.2: "Available Resource Report"
    @GetMapping("/available-resources")
    public ResponseEntity<ApiResponse<List<EmployeeUtilizationDTO>>> getAvailable() {
        List<EmployeeUtilizationDTO> report = allocationService.getAvailableResources();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/overloaded")
    public ResponseEntity<ApiResponse<List<EmployeeUtilizationDTO>>> getOverloaded() {
        List<EmployeeUtilizationDTO> report = allocationService.getOverloadedResources();
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
```

### 7. Danh sách endpoint hoàn chỉnh

| Method | Endpoint | Controller | Service Method |
|--------|----------|-----------|----------------|
| POST | `/api/v1/employees` | EmployeeController | create |
| GET | `/api/v1/employees` | EmployeeController | findAll |
| GET | `/api/v1/employees/{id}` | EmployeeController | findById |
| PUT | `/api/v1/employees/{id}` | EmployeeController | update |
| DELETE | `/api/v1/employees/{id}` | EmployeeController | delete |
| POST | `/api/v1/projects` | ProjectController | create |
| GET | `/api/v1/projects` | ProjectController | findAll |
| GET | `/api/v1/projects/{id}` | ProjectController | findById |
| PUT | `/api/v1/projects/{id}` | ProjectController | update |
| POST | `/api/v1/allocations` | AllocationController | create |
| PUT | `/api/v1/allocations/{id}` | AllocationController | update |
| DELETE | `/api/v1/allocations/{id}` | AllocationController | delete |
| GET | `/api/v1/employees/{id}/workload` | WorkloadController | getWorkload |
| GET | `/api/v1/reports/utilization` | ReportController | getUtilization |
| GET | `/api/v1/reports/available-resources` | ReportController | getAvailable |
| GET | `/api/v1/reports/overloaded` | ReportController | getOverloaded |
| GET | `/api/v1/health` | HealthController (có sẵn) | — |

---

## Kết quả sau phase 7

- 6 controllers: Employee, Project, Allocation, Workload, Report, Health (có sẵn)
- Mỗi endpoint trả về `ApiResponse<T>` chuẩn
- HTTP status đúng: 201 cho POST, 200 cho GET/PUT, 204 cho DELETE
- Employee DELETE không implement — không nằm trong requirement
- Build thành công, Swagger UI hiển thị đủ endpoints
