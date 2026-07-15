# Backend Implementation Rules

> File này tổng hợp **tất cả rule/constraint** cho BE implementation — architecture, format, message, code quality.
> Mọi thành viên phải đọc và tuân thủ trước khi viết code, review code, hoặc debug.
> Dựa trên: `requirements-analysis.md`, các phase docs, và code đang có.

---

## 1. Architecture Rules

### 1.1 Layer Separation (STRICT)

```
Controller (REST endpoints)
    ↓ @Valid, @RequestBody, ResponseEntity<ApiResponse<T>>
Service (Business Logic)
    ↓ @Transactional, @Version
Repository (Spring Data JPA)
    ↓ extends JpaRepository<Entity, Long>
Entity (JPA entities)
    ↓ mapped to
Database (PostgreSQL via Flyway)
```

**Rules:**
1. **Controller KHÔNG được chứa business logic** — gọi Service, trả về Response. Không if/else nghiệp vụ.
2. **Service KHÔNG được return Entity** — luôn convert sang Response DTO trước khi return.
3. **Repository KHÔNG được chứa business logic** — chỉ JPQL/SQL queries + method naming.
4. **Entity KHÔNG được expose ra ngoài API** — dùng DTO Request/Response riêng.
5. **Dependency direction:** Controller → Service → Repository. Không reverse.

### 1.2 Package Structure

```
com.resourcemanagement/
  ├── config/               # Configuration (CORS, Swagger)
  ├── controller/           # REST Controllers
  ├── dto/
  │   ├── request/          # Request DTO records (AllocationRequest, ...)
  │   └── response/         # Response DTO records (AllocationResponse, ...)
  ├── exception/            # Custom exceptions + GlobalExceptionHandler
  ├── model/
  │   ├── entity/           # JPA entities
  │   └── enums/            # Java enums (ProjectStatus)
  ├── repository/           # JPA repositories
  └── service/              # Business logic
```

### 1.3 API Base Path

Tất cả endpoints đều có prefix `/api/v1` — thêm prefix này trong `@RequestMapping` của mỗi controller (ví dụ: `@RequestMapping("/api/v1/employees")`).

**Không dùng** `server.servlet.context-path` — giữ mặc định để tránh conflict với Swagger/SpringDoc paths.

### 1.4 API Method & Status Mapping

| Method | Status | Usage |
|--------|--------|-------|
| `GET /resource` | 200 OK | List (có filter, page, sort) |
| `GET /resource/{id}` | 200 OK | Single item |
| `POST /resource` | 201 Created | Create |
| `PUT /resource/{id}` | 200 OK | Full update |
| `DELETE /resource/{id}` | 204 No Content | Delete (không body) |

---

## 2. Code Format & Naming Rules

### 2.1 Naming Convention

| Element | Convention | Example |
|---------|-----------|---------|
| Package | `camelCase` | `dto`, `model.entity` |
| Class/Interface | `PascalCase` | `AllocationService`, `EmployeeRepository` |
| Method | `camelCase` | `findAll()`, `getTotalAllocationByEmployee()` |
| Variable | `camelCase` | `employeeService`, `currentTotal` |
| Constant | `UPPER_SNAKE_CASE` | `ProjectStatus.COMPLETED` |
| Record | `PascalCase` | `EmployeeRequest`, `AllocationResponse` |
| Enum | `PascalCase` | `ProjectStatus` |
| Enum values | `UPPER_SNAKE_CASE` | `PLANNING`, `ACTIVE`, `COMPLETED` |
| DB table | `snake_case` | `employee`, `allocation` |
| DB column | `snake_case` | `employee_id`, `allocation_percent` |
| HTTP header | `kebab-case` | `Content-Type` |

### 2.2 Java Records cho DTO

Tất cả Request/Response DTO phải dùng **Java 21 Records** (không dùng `@Data` class):

```java
// ✅ ĐÚNG — dùng record
public record EmployeeRequest(
    @NotBlank(message = "Employee code is required")
    String employeeCode,
    @Email(message = "Invalid email format")
    String email
) {}

// ❌ SAI — không dùng @Data class cho DTO
public class EmployeeRequest {
    @NotBlank
    private String employeeCode;
}
```

Ngoại lệ: `ApiResponse<T>` và `ErrorResponse` là generic, cần builder pattern → dùng `@Builder` class.

### 2.3 Lombok Usage

- Entities: `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`
- Không dùng `@Data` — nó gắn `@EqualsAndHashCode` gây lỗi trên entity (proxy).
- `ApiResponse` & `ErrorResponse`: `@Getter @Setter @Builder`

### 2.4 Constructor Injection

Dùng `@RequiredArgsConstructor` cho dependency injection — **không dùng `@Autowired`**:

```java
// ✅ ĐÚNG
@Service
@RequiredArgsConstructor
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
}

// ❌ SAI
@Service
public class EmployeeService {
    @Autowired
    private EmployeeRepository employeeRepository;
}
```

---

## 3. API Response Format Rules

### 3.1 Success Response

Dùng `ApiResponse<T>`:

```json
{
  "success": true,
  "status": 200,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-07-15T10:30:00.000Z"
}
```

- `timestamp` luôn là `Instant` (UTC), format ISO-8601.
- `data` có thể là object, list, hoặc null.
- Static factories: `ApiResponse.success(data)`, `ApiResponse.created(data, msg)`.

### 3.2 Success Response cho GET List

```java
@GetMapping
public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAll(...) {
    List<EmployeeResponse> list = employeeService.findAll(...);
    return ResponseEntity.ok(ApiResponse.success(list));
    // message mặc định: "Operation successful"
}
```

### 3.3 Success Response cho POST

```java
@PostMapping
public ResponseEntity<ApiResponse<EmployeeResponse>> create(@Valid @RequestBody EmployeeRequest request) {
    EmployeeResponse result = employeeService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(result, "Employee created successfully"));
}
```

### 3.4 Success Response cho DELETE

DELETE **luôn** trả về 204 No Content — không body, không `ApiResponse`:

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id) {
    employeeService.delete(id);
    return ResponseEntity.noContent().build();
}
```

### 3.5 Error Response

Dùng `ErrorResponse`:

```json
{
  "success": false,
  "status": 400,
  "message": "Employee allocation exceeds 100%",
  "errorCode": "ALLOCATION_EXCEEDED",
  "timestamp": "2026-07-15T10:30:00.000Z"
}
```

### 3.6 Validation Error Response

```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2026-07-15T10:30:00.000Z",
  "errors": {
    "fullName": "Full name is required",
    "email": "Invalid email format"
  }
}
```

Dùng `MethodArgumentNotValidException` handler để map field errors.

### 3.7 Error Codes

| Exception | errorCode | Status | Khi nào |
|-----------|-----------|--------|---------|
| `EmployeeNotFoundException` | `EMPLOYEE_NOT_FOUND` | 404 | Employee không tồn tại |
| `EmployeeCodeExistedException` | `EMPLOYEE_CODE_EXISTED` | 409 | Trùng employee code |
| `ProjectNotFoundException` | `PROJECT_NOT_FOUND` | 404 | Project không tồn tại |
| `ProjectCodeExistedException` | `PROJECT_CODE_EXISTED` | 409 | Trùng project code |
| `AllocationNotFoundException` | `ALLOCATION_NOT_FOUND` | 404 | Allocation không tồn tại |
| `AllocationExceededException` | `ALLOCATION_EXCEEDED` | 400 | Tổng allocation > 100% |
| `AllocationOverlapException` | `ALLOCATION_OVERLAP` | 409 | Trùng thời gian allocation |
| `ProjectCompletedException` | `PROJECT_COMPLETED` | 400 | Allocate vào COMPLETED project |
| `InvalidDateRangeException` | `INVALID_DATE_RANGE` | 400 | Date range không hợp lệ |
| `OptimisticLockException` | `OPTIMISTIC_LOCK` | 409 | Conflict khi save |

---

## 4. Entity Implementation Rules

### 4.1 Entity Structure

```java
@Entity
@Table(name = "employee")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    private Long employeeId;

    // ... business fields with column annotations

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 4.2 Audit Columns

Mọi entity **phải có** `createdAt` và `updatedAt`:
- `createdAt`: `nullable = false, updatable = false` — set 1 lần khi tạo.
- `updatedAt`: `nullable = false` — update mỗi lần sửa.

### 4.3 Relationship Rules

| Relationship | Annoation | Fetch | Cascade |
|-------------|-----------|-------|---------|
| Allocation → Employee | `@ManyToOne` | `LAZY` | KHÔNG cascade |
| Allocation → Project | `@ManyToOne` | `LAZY` | KHÔNG cascade |

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "employee_id", nullable = false)
private Employee employee;
```

### 4.4 Optimistic Lock

`Allocation` entity có `@Version`:

```java
@Version
@Column(name = "version", nullable = false)
private Long version;
```

---

## 5. Repository Implementation Rules

### 5.1 Repository Pattern

```java
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmployeeCode(String employeeCode);
    Page<Employee> findByDepartment(String department, Pageable pageable);
}
```

### 5.2 SUM Query Rule

Validation tổng allocation **phải dùng SUM query ở DB level**, không load records:

```java
// ✅ ĐÚNG — 1 query trả về 1 số
@Query("SELECT COALESCE(SUM(a.allocationPercent), 0) FROM Allocation a " +
       "WHERE a.employee.employeeId = :empId")
Integer getTotalAllocationByEmployee(@Param("empId") Long empId);

// ❌ SAI — load records vào memory chỉ để tính tổng
List<Allocation> findByEmployeeEmployeeId(Long empId);
// sau đó .stream().mapToInt(...).sum() — chỉ dùng cho workload page, ko cho validation
```

### 5.3 Report Query Rule

Report queries dùng `LEFT JOIN` để giữ cả employee chưa được allocate (hiển thị 0%):

```java
@Query("SELECT e.employeeId, e.fullName, COALESCE(SUM(a.allocationPercent), 0) " +
       "FROM Employee e LEFT JOIN Allocation a ON e.employeeId = a.employee.employeeId " +
       "GROUP BY e.employeeId, e.fullName " +
       "ORDER BY e.fullName ASC")
List<Object[]> findUtilizationReport();
```

---

## 6. Service Implementation Rules

### 6.1 Business Logic Rules (ALLOCATION)

Đây là phần quan trọng nhất — thứ tự validate trong `create()`:

1. **Check employee tồn tại** → `EmployeeNotFoundException`
2. **Check project tồn tại** → `ProjectNotFoundException`
3. **Check project status ≠ COMPLETED** → `ProjectCompletedException`
4. **Check date range** (endDate >= startDate, startDate >= project.startDate) → `InvalidDateRangeException`
5. **Check overlap** (cùng employee, cùng project, trùng thời gian) → `AllocationOverlapException`
6. **Check tổng ≤ 100%** (SUM query ở DB) → `AllocationExceededException`
7. **Save** — nếu `OptimisticLockException` → throw `OptimisticLockException` (409)

Không đảo thứ tự — validate nhanh trước, nặng sau.

### 6.2 Update Allocation Logic

Khi update allocation:
1. Lấy allocation cũ → lưu `oldPercent`
2. Validate giống create (bước 1-5)
3. **Tính tổng = currentTotal - oldPercent + newPercent**
4. Nếu > 100% → `AllocationExceededException`

```java
// Công thức đúng cho update:
int currentTotal = allocationRepository.getTotalAllocationByEmployee(request.employeeId());
int newTotal = currentTotal - allocation.getAllocationPercent() + request.allocationPercent();
//                                  ↑ trừ cũ                  ↑ cộng mới
```

### 6.3 @Transactional Rules

- **Create/Update/Delete** trong Service **PHẢI** có `@Transactional`.
- **Read-only methods** không cần `@Transactional`, hoặc `@Transactional(readOnly = true)`.
- `AllocationService` có catch `OptimisticLockException` — phải nằm trong cùng transaction.

### 6.4 Logging Rules

- **INFO**: CRUD operations (create/update/delete allocation, create employee, etc.)
- **WARN**: Validation fails, business rule violations
- **ERROR**: Unexpected exceptions (để GlobalExceptionHandler log)
- **Không dùng AOP** — project nhỏ, tự log trong từng method.

```java
// INFO — khi tạo allocation
log.info("Creating allocation: employee={}, project={}, percent={}%",
    request.employeeId(), request.projectId(), request.allocationPercent());

// WARN — khi validation fail
log.warn("Allocation exceeded 100% for employee={}: current={}, new={}",
    request.employeeId(), currentTotal, request.allocationPercent());

// INFO — khi xoá
log.info("Deleted allocation: id={}", id);
```

### 6.5 Controller → Service → Response Rule

Controller không gọi trực tiếp Repository. Luôn đi qua Service:

```java
// ✅ ĐÚNG
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
    EmployeeResponse employee = employeeService.findById(id);
    return ResponseEntity.ok(ApiResponse.success(employee));
}

// ❌ SAI — Controller gọi Repository
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<Employee>> getById(@PathVariable Long id) {
    Employee employee = employeeRepository.findById(id).orElseThrow(...);
    return ResponseEntity.ok(ApiResponse.success(employee)); // expose entity!
}
```

---

## 7. Exception Handling Rules

### 7.1 Custom Exception Structure

Dùng abstract `BaseException` — tất cả custom exception đều extends class này:

```java
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

### 7.2 Exception Naming

| Pattern | Example |
|---------|---------|
| `{Resource}NotFoundException` | `EmployeeNotFoundException` |
| `{Resource}CodeExistedException` | `EmployeeCodeExistedException` |
| `{BusinessRule}Exception` | `AllocationExceededException` |

### 7.3 Handler Order in GlobalExceptionHandler

Thứ tự các handler trong `GlobalExceptionHandler`:

1. `BaseException` — custom exceptions (catch-all cho custom)
2. `MethodArgumentNotValidException` — validation errors
3. `OptimisticLockException` — concurrent modification
4. `HttpMessageNotReadableException` — bad request body
5. `Exception` — fallback (unexpected errors)

Handler đầu tiên match sẽ chạy — vì `BaseException` extends `RuntimeException`,
nếu để handler `Exception` trước thì nó bắt hết. Đặt `BaseException` TRÊN CÙNG.

---

## 8. Validation Rules

### 8.1 Request Validation

```java
// EmployeeRequest
@NotBlank(message = "Employee code is required")
@Pattern(regexp = "^[A-Z0-9]{3,20}$", message = "Employee code must be 3-20 uppercase alphanumeric")
String employeeCode;

// AllocationRequest
@NotNull(message = "Allocation percent is required")
@Min(value = 1, message = "Allocation must be at least 1%")
@Max(value = 100, message = "Allocation must not exceed 100%")
Integer allocationPercent;
```

Rules:
- **Không dùng** `@NotBlank` trên field Integer/Long — dùng `@NotNull`.
- **Mọi message** đều là tiếng Anh, rõ ràng, có tên field + lý do.
- **AllocationPercent** dùng `@Min(1)`, không cho 0% (dead data).

### 8.2 @Min(1) cho AllocationPercent

**Quan trọng:** Allocation = 0% là dead data. Không cho phép.
- Nếu chưa phân bổ → không tạo record.
- Nếu cần placeholder → dùng status field riêng, không phải percent = 0.

---

## 9. Date Handling Rules

### 9.1 Date Type

- **DB column type:** `DATE` (không `TIMESTAMP`) — allocation theo ngày.
- **Java type:** `LocalDate` (không `Date`, không `LocalDateTime`).
- **Entity mapping:** `LocalDate` → `DATE` column.

### 9.2 Date Validations (trong Allocation)

```
1. endDate >= startDate                               → InvalidDateRangeException
2. startDate >= project.startDate                     → InvalidDateRangeException
3. Overlap: không 2 allocation trùng thời gian         → AllocationOverlapException
   trên cùng employee + cùng project
```

### 9.3 Timestamp (audit)

- Entity audit fields: dùng `LocalDateTime`.
- API response timestamp: dùng `Instant` (UTC).

---

## 10. Flyway Migration Rules

### 10.1 Migration Naming

```
V{major}{minor}__{description}.sql
V1__init_schema.sql
V2__seed_data.sql
V3__add_column_xxx.sql
```

### 10.2 Không sửa migration đã merge

- Migration đã merge → **KHÔNG SỬA**.
- Chỉ sửa nếu chưa commit/push.
- Nếu cần thay đổi schema → tạo file V{mới} mới.

### 10.3 Schema trong Java vs DB

- DB schema là **single source of truth** (qua Flyway).
- Hibernate `ddl-auto` chỉ để `validate` (không `update`, không `create-drop`).
- Entity mapping phải khớp với Flyway migration.

---

## 11. DTO Mapping Rules

### 11.1 Entity → Response DTO mapping

Mapping trong Service (không dùng mapper riêng vì project nhỏ):

```java
private EmployeeResponse toResponse(Employee e) {
    return new EmployeeResponse(
        e.getEmployeeId(), e.getEmployeeCode(), e.getFullName(),
        e.getEmail(), e.getRole(), e.getDepartment(),
        e.getCreatedAt(), e.getUpdatedAt()
    );
}
```

### 11.2 AllocationResponse Fields

```java
public record AllocationResponse(
    Long allocationId,
    Long employeeId,
    String employeeName,       // employee.fullName (JOIN)
    Long projectId,
    String projectName,        // project.projectName (JOIN)
    String projectCode,        // project.projectCode (JOIN)
    Integer allocationPercent,
    String roleInProject,
    LocalDate startDate,
    LocalDate endDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

AllocationResponse phải include `employeeName`, `projectName`, `projectCode` — vì FE cần hiển thị thông tin ngay, không phải gọi thêm API.

---

## 12. Controller Implementation Rules

### 12.1 Base Path

```yaml
# application.yml
server:
  servlet:
    context-path: /api/v1
```

Sau đó mỗi controller chỉ cần:

```java
@RestController
@RequestMapping("/employees")   // thay vì /api/v1/employees
```

### 12.2 GET List — Filter, Page, Sort

```java
@GetMapping
public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String department,
        @RequestParam(required = false) String role) {
    List<EmployeeResponse> list = employeeService.findAll(page, size, department, role);
    return ResponseEntity.ok(ApiResponse.success(list));
}
```

### 12.3 Controller Method Structure

```
Controller method:
  1. Gọi Service method
  2. Wrap kết quả trong ApiResponse
  3. Trả về ResponseEntity với status phù hợp
  (không try-catch — GlobalExceptionHandler lo)
```

### 12.4 Danh sách endpoints

| Method | Endpoint | Controller | Response body |
|--------|----------|-----------|---------------|
| POST | `/employees` | EmployeeController | `201 + ApiResponse<EmployeeResponse>` |
| GET | `/employees` | EmployeeController | `200 + ApiResponse<List<EmployeeResponse>>` |
| GET | `/employees/{id}` | EmployeeController | `200 + ApiResponse<EmployeeResponse>` |
| PUT | `/employees/{id}` | EmployeeController | `200 + ApiResponse<EmployeeResponse>` |
| POST | `/projects` | ProjectController | `201 + ApiResponse<ProjectResponse>` |
| GET | `/projects` | ProjectController | `200 + ApiResponse<List<ProjectResponse>>` |
| GET | `/projects/{id}` | ProjectController | `200 + ApiResponse<ProjectResponse>` |
| PUT | `/projects/{id}` | ProjectController | `200 + ApiResponse<ProjectResponse>` |
| POST | `/allocations` | AllocationController | `201 + ApiResponse<AllocationResponse>` |
| PUT | `/allocations/{id}` | AllocationController | `200 + ApiResponse<AllocationResponse>` |
| DELETE | `/allocations/{id}` | AllocationController | `204 No Content (no body)` |
| GET | `/employees/{id}/workload` | WorkloadController | `200 + ApiResponse<WorkloadResponse>` |
| GET | `/reports/utilization` | ReportController | `200 + ApiResponse<List<EmployeeUtilizationDTO>>` |
| GET | `/reports/available-resources` | ReportController | `200 + ApiResponse<List<EmployeeUtilizationDTO>>` |
| GET | `/reports/overloaded` | ReportController | `200 + ApiResponse<List<EmployeeUtilizationDTO>>` |

---

## 13. Code Quality Rules

### 13.1 SOLID trong BE

- **S**ingle Responsibility: Controller xử lý HTTP, Service xử lý business, Repository xử lý DB.
- **O**pen/Closed: Enum `ProjectStatus` — dễ thêm status mà không sửa code cũ.
- **L**iskov: Interface `JpaRepository` — có thể swap implementation.
- **I**nterface Segregation: `JpaRepository` chỉ expose method cần dùng.
- **D**ependency Inversion: Inject interface, không inject concrete class (Spring tự làm).

### 13.2 Return type

- GET list: `ResponseEntity<ApiResponse<List<T>>>`
- GET single: `ResponseEntity<ApiResponse<T>>`
- POST: `ResponseEntity<ApiResponse<T>>` với status 201
- DELETE: `ResponseEntity<Void>` với status 204

### 13.3 Không dùng

| Tuyệt đối không dùng | Lý do |
|---------------------|-------|
| `@Autowired` field injection | Không test được, phụ thuộc ngầm |
| `@Data` trên entity | `@EqualsAndHashCode` gây lỗi proxy |
| `java.util.Date` / `java.sql.Date` | Legacy, timezone issues |
| `@Transactional` trên Controller | Service layer mới xử lý transaction |
| System.out.println | Dùng Logger (SLF4J) |
| Wildcard import (`import ...*`) | Không rõ dependency |
| Magic number (`if(total > 100)`, `100 - total`) | Dùng hằng số `MAX_ALLOCATION = 100` |
| Try-catch trong Controller | GlobalExceptionHandler lo |
| Return Entity từ Controller | Security risk + over-fetching |

### 13.4 Constructor Injection Over @Autowired

```java
// ✅ ĐÚNG
@RequiredArgsConstructor
public class XxxService {
    private final XxxRepository xxxRepository;
}

// ❌ SAI
@Autowired private XxxRepository xxxRepository;
```

### 13.5 Code Order trong Class

```java
public class XxxService {
    // 1. Logger
    private static final Logger log = LoggerFactory.getLogger(XxxService.class);
    
    // 2. Dependencies (constructor injection)
    private final XxxRepository xxxRepository;
    
    // 3. Public methods (CRUD order: list, findById, create, update, delete)
    public List<T> findAll(...) {}
    public T findById(Long id) {}
    @Transactional public T create(Request request) {}
    @Transactional public T update(Long id, Request request) {}
    @Transactional public void delete(Long id) {}
    
    // 4. Private helper methods
    private Response toResponse(Entity e) {}
}
```

---

## 14. Testing Rules

(Dựa trên Phase 8)

| Layer | Framework | Annotation | Scope |
|-------|-----------|------------|-------|
| Service | JUnit 5 + Mockito | không có Spring context | Business rules |
| Controller | JUnit 5 + MockMvc | `@WebMvcTest` | HTTP mapping |
| Repository | JUnit 5 + H2 | `@DataJpaTest` | Query correctness |

### 14.1 Service Test Coverage (100% business rules)

- Create hợp lệ
- Tổng > 100% → `AllocationExceededException`
- Allocate vào COMPLETED → `ProjectCompletedException`
- startDate < project.startDate → `InvalidDateRangeException`
- endDate < startDate → `InvalidDateRangeException`
- Overlap time → `AllocationOverlapException`
- Employee/Project không tồn tại → not found exceptions
- Update: trừ cũ + thêm mới > 100%
- Boundary values: 1%, 100%, vừa đủ 100%

---

## 15. Deliverables Checklist

| # | Item | Format | Khi nào |
|---|------|--------|---------|
| 1 | Source code | Git (branch `be`) | Xuyên suốt |
| 2 | Flyway migrations | `.sql` | Phase 2 |
| 3 | README.md | Markdown | Cuối cùng |
| 4 | Postman collection | JSON | Phase 9 |
| 5 | API screenshots | PNG | Phase 9 |
| 6 | Swagger UI | http://localhost:8080/swagger-ui.html | Tự động |
| 7 | Docker Compose | `docker-compose.yml` | Phase 1 |

---

## 16. Common Mistakes to Avoid

| # | Mistake | Fix |
|---|---------|-----|
| 1 | `@Data` trên Entity → StackOverflow khi có `@ManyToOne` | Dùng `@Getter @Setter` |
| 2 | Load records để SUM validation | Dùng `COALESCE(SUM(...))` query |
| 3 | Return Entity từ Controller | Convert sang Response DTO |
| 4 | Quên `@Transactional` trên create/update | Thêm annotation |
| 5 | Magic number `100` trong code | `private static final int MAX_ALLOCATION = 100;` |
| 6 | Quên exclude allocation cũ khi overlap check update | Pass `excludeId` parameter |
| 7 | Dùng `@Autowired` | Đổi sang `@RequiredArgsConstructor` |
| 8 | Không log validation fail | Thêm `log.warn(...)` trước khi throw |
| 9 | Đặt `Exception` handler trước `BaseException` | Sắp xếp đúng thứ tự |
| 10 | CORS không match port FE | Cho phép localhost:5173, localhost:3000 |
