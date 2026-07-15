# BE Implementation Plan

> Dựa trên [requirements-analysis](../requirements-analysis.md), liệt kê các công việc cần làm theo thứ tự từ base xây lên.

---

### 1. Khởi tạo project ✅

- [x] Tạo Spring Boot project (Java 21, Maven) với các dependency: Spring Web, Spring Data JPA, PostgreSQL Driver, H2, Validation, SpringDoc OpenAPI, Lombok
- [x] Cấu hình `application.yml` (PostgreSQL) + `application-docker.yml` (Docker override)
- [x] Docker Compose:
  - `app` — Spring Boot (port 8080)
  - `db` — postgres:16-alpine (port 5432, volume persist data)
  - `pgadmin` — dùng để xem/soạn dữ liệu trực quan (port 5050)
- [x] Dockerfile multi-stage (`maven:3.9-eclipse-temurin-21` build → `eclipse-temurin:21-jre-alpine` run)
- [x] `.gitignore` Java/Spring + `README.md` hướng dẫn run

### 2. Entity & DB ✅

- [x] Tạo entities: `Employee`, `Project` (`ProjectStatus` enum: PLANNING / ACTIVE / COMPLETED), `Allocation` (`@Version` optimistic lock)
- [x] Flyway migration:
  - CREATE TABLE employee, project, allocation
  - FK constraints (`allocation → employee`, `allocation → project`)
  - Indexes (`employee_code`, `project_status`, `allocation_employee_id`, `allocation_project_id`)
  - UNIQUE constraints (`employee_code`, `project_code`, composite `(employee_id, project_id, start_date)`)
  - CHECK (`allocation_percent > 0 AND allocation_percent <= 100`)

### 3. Repository ✅

- [x] `EmployeeRepository` — filter by department/role (`?department=&role=`), `findAvailableByRole`, sort mặc định `fullName` ASC, pagination (`Pageable`)
- [x] `ProjectRepository` — filter by status/customer, sort by `startDate` DESC
- [x] `AllocationRepository` — `SUM` query cho validation (COALESCE), `findByEmployeeEmployeeId`, report queries (utilization, available, overloaded)

### 4. Exception & response ✅

- [x] Custom exceptions: `EmployeeNotFoundException` (404), `ProjectNotFoundException` (404), `AllocationNotFoundException` (404), `AllocationExceededException` (400), `AllocationOverlapException` (409)
- [x] `GlobalExceptionHandler` (`@RestControllerAdvice`):
  - `OptimisticLockException` → 409 Conflict
  - `MethodArgumentNotValidException` → 400 với field-level errors map
  - `HttpMessageNotReadableException` → 400
- [x] `ErrorResponse` DTO (message, status code, optional field errors)
- [x] 10 custom exceptions với đầy đủ errorCode
- [x] `ApiResponse<T>` generic cho success response
- [x] Build thành công `mvn compile`

### 5. DTO ✅

- [x] Request records: `EmployeeRequest`, `ProjectRequest`, `AllocationRequest` (Jakarta Validation — `@NotBlank`, `@Email`, `@Min(1)`, `@Max(100)`)
- [x] Response records: `EmployeeResponse`, `ProjectResponse`, `AllocationResponse`, `WorkloadResponse`, `EmployeeUtilizationDTO`, `AllocationDetailDTO`
- [x] Build thành công `mvn compile`

### 6. Service layer ✅

- [x] `EmployeeService` — CRUD + check duplicate `employeeCode`
- [x] `ProjectService` — CRUD + validate `endDate >= startDate`
- [x] `AllocationService` — full business rules:
  - [x] Range validation: `allocationPercent` 1-100% (Jakarta Validation ở Request DTO)
  - [x] Tổng ≤ 100%: **SUM query ở DB level** (không load records vào memory) + `@Version` Optimistic Lock
  - [x] Project không ở trạng thái COMPLETED
  - [x] Date range: `startDate >= project.startDate`, `endDate >= startDate`
  - [x] **Overlap check**: không cho 2 allocation trùng thời gian trên cùng 1 project-cùng employee
  - [x] Logging: INFO cho CRUD, WARN cho validation fail
  - [x] Catch `jakarta.persistence.OptimisticLockException` → throw custom `OptimisticLockException` (409, OPTIMISTIC_LOCK)
  - [x] Khi update: trừ allocation cũ + thêm allocation mới rồi kiểm tra tổng
- [x] Additional: thêm method `findByStatusAndCustomerContainingIgnoreCase` vào `ProjectRepository`
- [x] Additional: tạo custom `OptimisticLockException` (409) trong package exception
- [x] Additional: sửa `ProjectCompletedException` message format: `"Project {name} is completed. Cannot allocate."`
- [x] Build thành công `mvn compile`

### 7. Controller layer ✅

- [x] `EmployeeController` — POST, GET (list + filter + page + sort), GET/{id}, PUT/{id}
- [x] `ProjectController` — POST, GET (list + filter), GET/{id}, PUT/{id}
- [x] `AllocationController` — POST (201), PUT/{id} (200), DELETE/{id} (204)
- [x] `WorkloadController` — GET /employees/{id}/workload (trả danh sách allocation + tổng + available)
- [x] `ReportController` — GET /reports/utilization, /reports/available, /reports/overloaded
- [x] Base URL prefix: `/api/v1/...` — thêm prefix trong mỗi `@RequestMapping` (không dùng `server.servlet.context-path` để tránh double prefix với Swagger UI)

### 8. Testing

- [ ] Unit test Service layer (JUnit 5 + Mockito) — 100% business rules:
  - [ ] Create allocation hợp lệ
  - [ ] Tổng > 100% → throw exception
  - [ ] Allocation vào COMPLETED project → throw exception
  - [ ] Date range sai → throw exception
  - [ ] Overlap time → throw exception
  - [ ] OptimisticLock conflict → 409
  - [ ] Duplicate employeeCode / projectCode
- [ ] Integration test Controller (`@WebMvcTest`)
- [ ] Repository test (`@DataJpaTest` với H2 in-memory)
- [ ] Boundary values: allocationPercent = 1, 100, vừa đủ 100%

### 9. Deliverables

- [ ] Postman collection (export `.json`)
- [ ] API screenshots (mỗi endpoint success + error case)
- [ ] Swagger UI — verify tại http://localhost:8080/swagger-ui.html

### 10. AI Bonus (Spring AI)

- [ ] Thêm dependency `spring-ai-openai-spring-boot-starter`
- [ ] Config: `application.yml` thêm `spring.ai.openai.api-key`, model `gpt-4o-mini`, temperature 0.2
- [ ] `AiRecommendationService` — parse NL query → search criteria (role, minAvailable, department) → query DB
- [ ] `AiController` — POST /api/v1/ai/recommend
- [ ] Risk detection — phân tích capacity khi user báo "cần thêm N người", so với current allocation
