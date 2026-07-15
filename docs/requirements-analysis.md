# Project Resource Allocation Management System - Requirements Analysis

> Tài liệu này phân tích chi tiết từng yêu cầu, giải thích lý do chọn kiến trúc và công nghệ, đồng thời đưa ra quyết định triển khai cụ thể.

---

## 1. Bối Cảnh (Context)

```yaml
Công ty outsourcing triển khai nhiều dự án song song.
Một nhân viên có thể tham gia nhiều dự án với tỷ lệ phân bổ thời gian khác nhau.

Ví dụ:
  - NCG: 50%
  - GRID: 30%
  - Internal AI: 20%
  Tổng allocation = 100% → Hợp lệ.

  Nếu tổng allocation vượt quá 100%, hệ thống phải từ chối.
```

### 🔍 Phân tích & Quyết định triển khai

**Vấn đề cốt lõi:** Mô hình outsourcing có đặc thù "resource pool" — nhân viên là tài nguyên dùng chung, không thuộc riêng một dự án nào. Điều này khác với mô hình sản phẩm (mỗi người làm một dự án duy nhất).

**Tác động đến kiến trúc:**
| Yếu tố | Vấn đề đặt ra | Giải pháp cụ thể |
|--------|---------------|------------------|
| Nhiều dự án/người | Cần tracking allocation theo thời gian thực | Dùng bảng `allocation` riêng, không nhúng vào employee |
| Tổng ≤ 100% | Ràng buộc business quan trọng nhất | Validation ở **Service Layer**, dùng SUM query + Java check |
| Song song | Cần tránh race condition khi 2 request cùng allocate cho 1 employee | Optimistic Lock với `@Version` |

**Quyết định cụ thể:**
- Mỗi allocation là một dòng trong DB → dễ query, dễ JOIN, dễ tính tổng
- Ràng buộc 100% được implement bằng **Optimistic Lock (`@Version`)** — vì tỉ lệ 2 HR cùng sửa 1 employee gần như không xảy ra, optimistic lock là đủ nhẹ và an toàn
- Không dùng `SERIALIZABLE` isolation — quá nặng (lock toàn bộ table liên quan)
- Không dùng `PESSIMISTIC_WRITE` — lock nhiều dòng allocation không cần thiết

---

## 2. Mục Tiêu Hệ Thống

```yaml
Cho phép PM hoặc Resource Manager:
  - Quản lý nhân viên
  - Quản lý dự án
  - Phân bổ nhân sự vào dự án
  - Theo dõi workload
  - Tìm resource còn available
  - Báo cáo utilization
```

### 🔍 Phân tích & Quyết định triển khai

**Vai trò người dùng:** PM / Resource Manager là **internal user** → không cần authentication phức tạp (JWT/OAuth) ở version 1, nhưng phải để extension point.

**Quyết định cụ thể:**
- **Kiến trúc: REST API**, không phải GraphQL hay gRPC
  - REST là chuẩn cho hệ thống CRUD nội bộ
  - Dễ test với Postman (yêu cầu trong deliverable)
  - Spring Boot hỗ trợ REST native
- **Không dùng GraphQL** vì scope nhỏ, không cần query linh hoạt từ client
- **Không dùng gRPC** vì không có microservices, không cần inter-service communication
- **Layer:**
  - `Controller` → tiếp nhận request, trả về response (DTO)
  - `Service` → business logic
  - `Repository` → JPA interface, thao tác DB
- **DTO pattern:** Dùng riêng Request DTO và Response DTO, không expose entity ra ngoài

---

## 3. Functional Requirements

### 3.1 Employee Management

```yaml
Thông tin:
  - Employee Code (EMP001)
  - Full Name (Tuan Ho Anh)
  - Email (tuanha@company.com)
  - Role (Senior Developer)
  - Department (FSOFT-Q1)

API:
  POST /employees
  GET /employees
  GET /employees/{id}
  PUT /employees/{id}     (bổ sung — để cập nhật thông tin employee)
```

#### 🔍 Phân tích & Quyết định triển khai

**Thiết kế Entity:**
- `employee_id BIGSERIAL PRIMARY KEY` → dùng **số (Long)** làm PK, không dùng employee_code
  - Lý do: JOIN performance, index clustering, không thay đổi
  - Employee code là **business key** → vẫn `UNIQUE` nhưng không làm PK
- Department: xem xét dùng bảng riêng hoặc enum — vì để free text dẫn đến không đồng bộ dữ liệu (ví dụ: "FSOFT-Q1" vs "Fsoft Q1")

**API endpoints:**
| API | HTTP Method | Mục đích | Logic |
|-----|------------|----------|-------|
| `/employees` | POST | Tạo mới employee | `@Valid` + kiểm tra duplicate employee_code |
| `/employees` | GET | Danh sách employee | Support `?department=&role=` filter |
| `/employees/{id}` | GET | Chi tiết 1 employee | `@PathVariable` + `EmployeeNotFoundException` |
| `/employees/{id}` | PUT | Cập nhật employee | Kiểm tra tồn tại + validate fields |

**Triển khai cụ thể:**
```java
public record EmployeeRequest(
    @NotBlank(message = "Employee code is required")
    String employeeCode,

    @NotBlank(message = "Full name is required")
    String fullName,

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    String email,

    @NotBlank(message = "Role is required")
    String role,

    @NotBlank(message = "Department is required")
    String department
) {}
```

- **Sort:** Default sort by `fullName` ASC
- **Pagination:** Dùng `Pageable` của Spring Data, vì danh sách employee có thể lớn
- **Error:** `EmployeeNotFoundException` → @ResponseStatus(HttpStatus.NOT_FOUND)

---

### 3.2 Project Management

```yaml
Thông tin:
  - Project Code
  - Project Name
  - Customer
  - Start Date
  - End Date
  - Status (PLANNING / ACTIVE / COMPLETED)

API:
  POST /projects
  GET /projects
  GET /projects/{id}
  PUT /projects/{id}     (bổ sung — để cập nhật thông tin project)
```

#### 🔍 Phân tích & Quyết định triển khai

**Thiết kế Status:**
- Status là **cố định**, chỉ 3 giá trị → dùng `enum` Java, không cần bảng riêng
- Không dùng `String` vì dễ typo, không type-safe

```java
public enum ProjectStatus {
    PLANNING,
    ACTIVE,
    COMPLETED
}
```

**Validation đặc biệt:**
- `endDate` phải >= `startDate` → custom `@AssertTrue` hoặc `@ValidProjectDates`
- Không cho allocate vào `COMPLETED` project → kiểm tra trong business rule

**Query features:**
- `/projects?status=ACTIVE` — lọc project đang hoạt động
- `/projects?customer=` — lọc theo khách hàng
- Support sort by `startDate` DESC để thấy project mới nhất

**Design decision:**
- Start/End Date dùng `LocalDate` (java.time), không dùng `Date` cũ — tránh timezone issues
- `customer` là String đơn giản vì chưa cần quản lý customer riêng

---

### 3.3 Resource Allocation

```yaml
Thông tin:
  - Employee
  - Project
  - Allocation Percent (0 < x <= 100)
  - Start Date
  - End Date
  - Role In Project

Business Rules:
  1. 0 < allocation <= 100 (không cho phép 0% — vì 0% là dead data, không phản ánh công việc thực tế)
  2. Tổng allocation của 1 employee không được > 100%
  3. Không allocate vào COMPLETED project
```

#### 🔍 Phân tích & Quyết định triển khai

**Đây là module phức tạp nhất — cần phân tích kỹ:**

##### Business Rule 1: Range Validation
```yaml
Kiểu: Input validation
Triển khai: Jakarta Validation @Min(1) @Max(100)
```
- Dùng `@Min(1)` — không cho phép 0%.
  - Lý do: Allocation = 0% là **dead data**. Nếu chưa phân bổ thì đã tạo record làm gì?
  - Quy trình thực tế: PM cần người → xác định % → tạo allocation. Không có chuyện "tạo trước rồi gán % sau".
  - Nếu cần placeholder (vd: ghi nhân sự sẽ tham gia sau) thì dùng status field, không phải set percent = 0.
- `allocationPercent` là `Integer`, không phải `Double` — vì allocation theo %, không cần số lẻ.
- Custom message: `@Min(value = 1, message = "Allocation must be at least 1%")`

##### Business Rule 2: Tổng ≤ 100%
```yaml
Kiểu: Business validation — cần DB access
Triển khai: Service Layer + Repository query
```
**Đây là phần quan trọng nhất của hệ thống.** Có 2 use case riêng biệt:

**Use case A — Validation (kiểm tra trước khi create/update):**
Chỉ cần tổng allocation hiện tại → tính SUM ở DB (không load records vào memory):

```java
@Query("SELECT COALESCE(SUM(a.allocationPercent), 0) FROM Allocation a " +
       "WHERE a.employee.employeeId = :empId")
Integer getTotalAllocationByEmployee(@Param("empId") Long empId);
```

**Use case B — Hiển thị workload page (GET /employees/{id}/workload):**
Cần từng record để hiển thị danh sách → load records là bắt buộc:

```java
List<Allocation> allocations = allocationRepository.findByEmployeeEmployeeId(empId);
// Tính tổng trong Java từ dữ liệu đã có (không cần query thêm)
int total = allocations.stream().mapToInt(Allocation::getAllocationPercent).sum();
```

> ⚠️ **Lưu ý:** Code cũ gộp 2 use case làm một — load records để validation là không tối ưu. Tách riêng validation (DB SUM) và hiển thị (load records + tính trong Java).

**Vấn đề Race Condition:**
- 2 request POST /allocations cùng lúc cho cùng employee → cả 2 đều đọc currentTotal = 50%, mỗi cái thêm 40% → vượt 100%
- Giải pháp: **Optimistic Lock với `@Version`**

```java
@Entity
@Table(name = "allocation")
public class Allocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long allocationId;

    @Version  // Optimistic Lock
    private Long version;

    // ... other fields
}
```

**Quyết định: Dùng `@Version` (Optimistic Lock)** vì:
- Tỉ lệ 2 HR cùng sửa 1 employee gần như không xảy ra — không cần lock nặng
- Pessimistic lock lock nhiều dòng allocation không cần thiết
- `@Version` tự động throw `OptimisticLockException` nếu có conflict → catch và trả về lỗi 409 Conflict
- Không cần thêm dependency, không cần quản lý lock

##### Business Rule 3: Project Status
```yaml
Kiểu: Business validation
Triển khai: Service Layer — check project.status != COMPLETED trước khi create
```

##### Thiết kế Relationship:
- **Employee** `1 ──── *` **Allocation** `* ──── 1` **Project**
- Dùng `@ManyToOne` ở phía Allocation (owning side)
- Fetch type: `LAZY` — tránh N+1, chỉ load khi cần
- Cascade: không dùng cascade — tự quản lý save

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "employee_id")
private Employee employee;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "project_id")
private Project project;
```

**Date range validation:**
- `endDate` >= `startDate` (trong cùng 1 allocation)
- `startDate` >= project's `startDate` (không allocate trước khi project bắt đầu)
- Overlap check: 1 employee không thể có 2 allocation trùng thời gian trên cùng 1 project. Nếu khác project, overlap được phép miễn tổng ≤ 100%.

**Response format khi lỗi:**
```json
{
    "message": "Employee allocation exceeds 100%",
    "status": 400
}
```
→ Dùng `@ExceptionHandler` global, format response chuẩn.

---

## 4. Reporting Functions

### 4.1 Employee Utilization Report

```yaml
Hiển thị tổng allocation của từng nhân viên.
```

**Triển khai:**
```java
@Query("SELECT e.employeeId, e.fullName, COALESCE(SUM(a.allocationPercent), 0) " +
       "FROM Employee e LEFT JOIN Allocation a ON e.employeeId = a.employee.employeeId " +
       "GROUP BY e.employeeId, e.fullName")
List<Object[]> findUtilizationReport();
```

🔹 **Dùng LEFT JOIN** — giữ cả employee chưa được allocate (hiển thị 0%).  
🔹 **Kết quả trả về DTO** `EmployeeUtilizationDTO(employeeId, fullName, totalAllocation, available)`.

### 4.2 Available Resource Report

```yaml
Employee có Allocation < 100% → Available > 0%
```

**Triển khai:** `HAVING SUM(a.allocationPercent) < 100` hoặc filter Java stream.  
**Performance decision:** dùng `HAVING` ở DB level — nhanh hơn vì filter trước khi trả về Java.

### 4.3 Overloaded Employee Report

```yaml
Employee có Allocation > 90%
```

**Same approach** — `HAVING SUM(a.allocationPercent) > 90`.

---

## 5. Database Design

```sql
CREATE TABLE employee (
    employee_id BIGSERIAL PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(100),
    role VARCHAR(50),
    department VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project (
    project_id BIGSERIAL PRIMARY KEY,
    project_code VARCHAR(20) UNIQUE,
    project_name VARCHAR(200),
    customer VARCHAR(100),
    status VARCHAR(20),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE allocation (
    allocation_id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    allocation_percent INTEGER NOT NULL CHECK (allocation_percent > 0 AND allocation_percent <= 100),
    role_in_project VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    version BIGINT DEFAULT 0,        -- Optimistic Lock
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (employee_id, project_id, start_date)  -- Ngăn duplicate allocation
);
```

### 🔍 Phân tích & Quyết định triển khai

**Tại sao dùng PostgreSQL?**
| Tiêu chí | PostgreSQL | Lý do chọn |
|----------|-----------|------------|
| ACID | ✅ | Quan trọng cho allocation validation — transaction an toàn |
| BIGSERIAL | ✅ | Tự động tăng sequence, không conflict |
| CHECK constraint | ✅ | `CHECK (allocation_percent > 0 AND allocation_percent <= 100)` |
| Unique constraint | ✅ | `employee_code UNIQUE`, `project_code UNIQUE`, composite UNIQUE |
| JOIN Performance | ✅ | Index + analyze support tốt |
| Free & production-ready | ✅ | So với Oracle/MySQL |

**Thiếu sót trong DB design gốc cần bổ sung:**
- **FK constraints** — không có `FOREIGN KEY` trong SQL mẫu, cần thêm:

```sql
ALTER TABLE allocation
ADD CONSTRAINT fk_allocation_employee
FOREIGN KEY (employee_id) REFERENCES employee(employee_id);

ALTER TABLE allocation
ADD CONSTRAINT fk_allocation_project
FOREIGN KEY (project_id) REFERENCES project(project_id);
```

- **Indexes:**
```sql
CREATE INDEX idx_employee_code ON employee(employee_code);
CREATE INDEX idx_project_status ON project(status);
CREATE INDEX idx_allocation_employee ON allocation(employee_id);
CREATE INDEX idx_allocation_project ON allocation(project_id);
```

- **Unique constraint:** `UNIQUE (employee_id, project_id, start_date)` — ngăn insert duplicate allocation (cùng employee, cùng project, cùng thời gian)
- **Audit columns:** `created_at`, `updated_at` — tracking thời gian tạo/sửa
- **Optimistic Lock column:** `version BIGINT DEFAULT 0`

**Tại sao dùng `BIGSERIAL` (Long 64-bit)?**
- Số lượng employee/project có thể > 2 tỷ trong hệ thống enterprise
- Tương thích với Java `Long`

**Tại sao `DATE` không phải `TIMESTAMP`?**
- Allocation theo ngày, không theo giờ (theo tháng thường)
- Đơn giản hơn cho báo cáo `GROUP BY date`

---

## 6. API Requirements

```yaml
POST /allocations          → Tạo mới
PUT /allocations/{id}      → Cập nhật
DELETE /allocations/{id}   → Xóa (bổ sung — dọn dẹp allocation khi employee rời project)
GET /employees/{id}/workload → Workload 1 employee
```

### 🔍 Phân tích & Quyết định triển khai

**Tại sao cần DELETE /allocations/{id}?**

| Use case | Mô tả |
|----------|-------|
| Employee chuyển dự án | Rời khỏi 1 project → xóa allocation (không phải update về 0%) |
| Tạo sai | PM tạo nhầm allocation → cần xóa để tạo lại |
| Project kết thúc sớm | Dọn dẹp allocation không còn hiệu lực |

> Không thể dùng update `allocation_percent = 0` thay cho DELETE vì business rule `0 < allocation <= 100` không cho phép 0%. Xóa record là cách chính xác.

**Thiết kế RESTful:**
| Method | Endpoint | Action | Idempotent | Status |
|--------|----------|--------|------------|--------|
| POST | /allocations | Create | ❌ | 201 Created |
| PUT | /allocations/{id} | Update | ✅ | 200 OK |
| DELETE | /allocations/{id} | Delete | ✅ | 204 No Content |
| GET | /employees/{id}/workload | Read | ✅ | 200 OK |

**PUT vs PATCH:**
- Dùng **PUT** vì update toàn bộ fields của allocation
- Nếu muốn update partial (change percent only) → dùng PATCH
- Yêu cầu gốc nói PUT → giữ PUT

**POST /allocations chi tiết:**
```yaml
Request body:
  employeeId: Long       → employee tồn tại (check + EmployeeNotFoundException)
  projectId: Long        → project tồn tại + không COMPLETED
  allocationPercent: int → 1-100 (không cho phép 0)
  roleInProject: String  → không rỗng
  startDate: LocalDate   → không null
  endDate: LocalDate     > startDate
```

**PUT /allocations/{id} chi tiết:**
- Validation giống POST
- Kiểm tra allocation tồn tại → `AllocationNotFoundException`
- Re-calculate tổng allocation khi update (trừ allocation cũ, + allocation mới)
- Nếu update liên quan đến thay đổi employee → kiểm tra tổng trên employee mới

**DELETE /allocations/{id} chi tiết:**
- Kiểm tra allocation tồn tại → `AllocationNotFoundException`
- Xóa record — giải phóng capacity cho employee
- Log action

**GET /employees/{id}/workload:**
```json
Trả về:
{
  "employeeId": 1,
  "employeeName": "Tuan Ho Anh",
  "totalAllocation": 80,
  "available": 20,
  "allocations": [
    {
      "allocationId": 1,
      "projectName": "NCG",
      "projectCode": "NCG-001",
      "allocationPercent": 50,
      "roleInProject": "Backend Developer",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    ...
  ]
}
```

**Thiết kế Response chuẩn** — dùng `ResponseEntity` Spring:
```java
@PostMapping
public ResponseEntity<AllocationResponse> create(
    @Valid @RequestBody AllocationRequest request
) {
    // ...
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}

@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id) {
    allocationService.delete(id);
    return ResponseEntity.noContent().build();
}
```

---

## 7. Technical Requirements

```yaml
Backend:
  - Java 21
  - Spring Boot
  - Spring Data JPA
  - PostgreSQL
  - Maven

Validation:
  - @NotBlank @Email @Min @Max (có custom message)

Exception Handling:
  - EmployeeNotFoundException
  - ProjectNotFoundException
  - AllocationExceededException
  - Global Exception Handler
  - OptimisticLockException → 409 Conflict

Logging:
  - Create Allocation
  - Update Allocation
  - Remove Allocation
```

> **Ghi chú:** Requirement gốc ghi "Java 17+" nhưng team dùng **Java 21** (phiên bản mới hơn, vẫn LTS).

### 🔍 Phân tích & Quyết định triển khai

#### Tại sao chọn từng technology?

| Technology | Lý do chọn | Không chọn |
|-----------|------------|-----------|
| **Java 21** | LTS (support đến 2031). Virtual threads, records, pattern matching, sealed classes, text blocks. Spring Boot 3.3+ support chính thức | Java 17 (cũ hơn), Java 11 (quá cũ) |
| **Spring Boot 3.3+** | Auto-config, embedded Tomcat, starter dependencies, Java 21 native support | Spring Boot 2 (cuối vòng đời), Quarkus (cộng đồng nhỏ hơn) |
| **Spring Data JPA (Hibernate)** | Giảm boilerplate CRUD, tự động sinh query | JDBC thuần (quá thấp), MyBatis (cần viết nhiều XML) |
| **PostgreSQL** | ACID, JSON support, production-grade | H2 (dev only), MySQL (less ACID strict) |
| **Maven** | Chuẩn enterprise, dependency management rõ ràng | Gradle (learning curve, chậm hơn với project nhỏ) |

#### Layer Architecture

```
Controller (REST endpoints)
    ↓ @Valid, @RequestBody, ResponseEntity
Service (Business Logic)
    ↓ @Transactional, @Version (optimistic lock)
Repository (Spring Data JPA)
    ↓ extends JpaRepository
Entity (JPA entities)
    ↓ mapped to
Database (PostgreSQL)
```

**Lý do không thêm các layer khác:**
- **Mapper Layer:** Dùng MapStruct hoặc tự viết mapper methods trong Service — không cần layer riêng vì entity ⇔ DTO mapping đơn giản
- **DTO Layer:** Dùng record Java 21 ngay trong package dto, không cần thư mục riêng
- **Config Layer:** Chỉ cần application.yml + vài @Configuration class

#### Exception Handling cụ thể

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EmployeeNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEmployeeNotFound(EmployeeNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage(), "EMPLOYEE_NOT_FOUND"));
    }

    @ExceptionHandler(AllocationExceededException.class)
    public ResponseEntity<ErrorResponse> handleAllocationExceeded(AllocationExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(ex.getMessage(), "ALLOCATION_EXCEEDED"));
    }

    @ExceptionHandler(OptimisticLockException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(OptimisticLockException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("Data was modified by another user. Please retry.", "CONCURRENT_MODIFICATION"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        // Map field errors → chi tiết từng field lỗi
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e ->
            errors.put(e.getField(), e.getDefaultMessage())
        );
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
    }
}
```

#### Logging

**Quyết định: Dùng manual logging (không AOP).**

| Tiêu chí | Manual | AOP |
|----------|--------|-----|
| Boilerplate | 3 dòng log cho 3 methods CRUD | Phải tạo Aspect + Annotation + pointcut |
| Đọc hiểu | Log rõ ràng trong từng method | Phải nhảy sang file aspect để biết format |
| Maintain | Sửa từng method nếu cần | Sửa 1 chỗ, nhưng khó debug |
| Phù hợp | **Project nhỏ, ít method** | Project lớn, nhiều method cần log |

> Với scope project này chỉ có 3 CRUD methods cho allocation, manual logging là đủ. AOP là over-engineering.

```java
@Service
@Transactional
public class AllocationService {
    private static final Logger log = LoggerFactory.getLogger(AllocationService.class);

    public AllocationResponse create(AllocationRequest request) {
        log.info("Creating allocation: employee={}, project={}, percent={}%",
            request.employeeId(), request.projectId(), request.allocationPercent());
        // ... business logic
    }

    public AllocationResponse update(Long id, AllocationRequest request) {
        log.info("Updating allocation id={}: employee={}, project={}, percent={}%",
            id, request.employeeId(), request.projectId(), request.allocationPercent());
        // ... business logic
    }

    public void delete(Long id) {
        log.info("Removing allocation: id={}", id);
        // ... business logic
    }
}
```

**Validation fail log:**
```java
// Khi validation fail (WARN level)
if (currentTotal + newAllocation > 100) {
    log.warn("Allocation exceeded 100% for employee={}: current={}, new={}",
        employeeId, currentTotal, newAllocation);
    throw new AllocationExceededException("Employee allocation exceeds 100%");
}
```

**Logging strategy:**
- **INFO:** Mọi hành động CRUD allocation (create/update/delete)
- **WARN:** Validation fails, business rule violations
- **ERROR:** Exceptions, DB errors
- **DEBUG:** Chi tiết query parameters (dev only)
- Log format: `timestamp [thread] LEVEL logger - message` (logback pattern)

---

## 8. AI Bonus Features

### 8.1 AI Resource Recommendation

```yaml
User input: "Tìm Java Developer còn tối thiểu 50% available."
Output: Danh sách employee phù hợp.
```

**Thách thức:** User có thể gõ theo nhiều cách khác nhau:
- "Tìm Java Developer còn tối thiểu 50% available"
- "Cần người Java còn trống tầm 50%"
- "Tìm dev Java free 50%"
- "Senior Java còn ít nhất 30%"

→ Rule-based parse (regex) không handle được variation ngôn ngữ tự nhiên. Cần LLM.

### 8.2 AI Risk Detection

```yaml
User input: "Sprint tới cần thêm 2 Java Developer."
Output: Risk analysis dựa trên current capacity.
```

#### 🔍 Phân tích & Quyết định triển khai

##### Có cần Spring AI không?

**Spring AI** là thư viện của Spring ecosystem cung cấp abstraction layer cho các AI provider (OpenAI, Claude, Ollama, ...).

| Tiêu chí | Tự gọi API thuần (RestClient) | Spring AI |
|----------|-------------------------------|-----------|
| Code complexity | Viết nhiều boilerplate (HTTP call, parse JSON, retry) | Abstraction sẵn — `ChatClient` interface |
| Multi-provider | Phải tự switch provider | Spring AI hỗ trợ sẵn OpenAI, Claude, Ollama, ... |
| Prompt template | Dùng String.format() thủ công | `PromptTemplate` có sẵn |
| Output parsing | Parse JSON thủ công → DTO | `BeanOutputConverter` tự động map |
| Tool calling / Function calling | Tự implement | Built-in support |
| Kích thước dependency | 0 (chỉ RestClient có sẵn) | ~5-10MB |

**Quyết định: ✅ Dùng Spring AI** vì:
- Giảm đáng kể boilerplate code
- Tính năng output converter (JSON → Java DTO) rất hữu ích cho use case này
- Dễ dàng switch provider (có thể dùng Ollama local cho dev, Claude cho production)
- Là thư viện chính thức từ Spring team, được maintain

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    <version>1.0.0-M6</version>
</dependency>
```

```yaml
# application.yml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4o-mini
          temperature: 0.2
```

**Triển khai cụ thể với Spring AI:**

```java
@Service
public class AiRecommendationService {

    private final ChatClient chatClient;
    private final EmployeeRepository employeeRepository;

    public AiRecommendationService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public record SearchCriteria(String role, Integer minAvailable, String department) {}

    public List<Employee> recommend(String userQuery) {
        // Bước 1: Parse user query → search criteria via AI
        SearchCriteria criteria = chatClient.prompt()
            .user(u -> u.text("""
                You are a resource allocation assistant.
                Extract search criteria from the user query below.
                Return ONLY a JSON object with these fields (all nullable):
                - role: the job role mentioned (e.g. "Java Developer", "Senior Developer")
                - minAvailable: minimum available percentage as a number (e.g. 50)
                - department: department name if mentioned

                Query: {query}
                """)
                .param("query", userQuery))
            .call()
            .entity(SearchCriteria.class);

        // Bước 2: Query DB với criteria
        if (criteria.role() != null && criteria.minAvailable() != null) {
            return employeeRepository.findAvailableByRole(
                criteria.role(), criteria.minAvailable()
            );
        }
        // ... fallback queries
    }
}
```

##### Có cần Vector Database không?

**Không cần.** Lý do:

| Yếu tố | Giải thích |
|--------|-----------|
| Dữ liệu có cấu trúc | Employee, Project, Allocation là structured data trong PostgreSQL — không phải document/văn bản để semantic search |
| Query pattern | "Java Developer còn 50%" → role + số %, query SQL thuần là đủ nhanh và chính xác |
| Không có text search | Không cần tìm kiếm theo nghĩa/ngữ cảnh trên nội dung phi cấu trúc |
| Chi phí | Vector DB (pgvector, Pinecone, Weaviate) thêm complexity mà không giải quyết vấn đề gì mới cho use case này |
| Scale | Hệ thống quản lý nhân sự nội bộ, không phải ứng dụng search document |

**Kết luận: Dùng PostgreSQL thuần.** Nếu sau này có requirement semantic search (tìm kiếm mô tả dự án, ghi chú, CV) thì mới thêm pgvector extension.

---

## 9. Deliverables

```yaml
1. Source Code Git Repository
2. SQL Script Create Table
3. README.md
4. Postman Collection
5. API Screenshot
6. AI Review Report
```

### 🔍 Phân tích & Quyết định triển khai

| Deliverable | Công cụ / Format | Ghi chú |
|------------|-----------------|---------|
| Git Repository | GitHub / GitLab | Dùng `.gitignore` cho Java/Spring |
| SQL Script | `src/main/resources/schema.sql` | Cả create table + seed data |
| README.md | Markdown | Hướng dẫn run, API doc, tech stack |
| Postman Collection | `postman_collection.json` | Export từ Postman, import được |
| API Screenshot | PNG file | Chụp kết quả mỗi API chạy thành công + lỗi |
| AI Review Report | Markdown/PDF | Report từ AI code review tool |

---

## 10. Tiêu Chí Đánh Giá

```yaml
Java:        OOP, SOLID, Exception Handling, Layer Design
Database:    PK/FK, JOIN, GROUP BY, Aggregate Functions
Spring Boot: REST API, Validation, Service Layer, Repository Layer
Business:    Allocation Validation, Workload Calculation, Project Status
Bonus:       Unit Test, Swagger, Docker, AI Integration
```

### 🔍 Phân tích & Quyết định triển khai

#### Cụ thể hóa từng tiêu chí:

**Java — OOP & SOLID:**
- **S**ingle Responsibility: Controller chỉ xử lý HTTP, Service chỉ xử lý business, Repository chỉ xử lý DB
- **O**pen/Closed: Dùng `enum ProjectStatus` thay vì string — dễ thêm status mới
- **L**iskov: Dùng interface `AllocationService` → có thể swap implementation
- **I**nterface Segregation: `JpaRepository` có sẵn, chỉ expose method cần
- **D**ependency Inversion: Inject `AllocationService` interface, không inject class concrete

**Database — PK/FK cụ thể:**
- `employee.employee_id` PK → `allocation.employee_id` FK
- `project.project_id` PK → `allocation.project_id` FK
- `employee.employee_code` UNIQUE
- `project.project_code` UNIQUE
- `allocation(employee_id, project_id, start_date)` UNIQUE
- `@Version` cho optimistic lock

**JOIN cụ thể:**
```sql
-- Employee-Allocation JOIN (Utilization Report)
SELECT e.full_name, COALESCE(SUM(a.allocation_percent), 0)
FROM employee e
LEFT JOIN allocation a ON e.employee_id = a.employee_id
GROUP BY e.employee_id, e.full_name;

-- Allocation-Project JOIN (Allocation details)
SELECT a.allocation_percent, p.project_name, p.project_code
FROM allocation a
JOIN project p ON a.project_id = p.project_id
WHERE a.employee_id = ?;
```

**Spring Boot:**
- REST: Dùng `@RestController`, `@RequestMapping("/api/v1/...")`
- Validation: `@Valid` + `@Validated` + custom validator + custom message
- Service Layer: `@Service` + `@Transactional` + `@Version`
- Repository: `extends JpaRepository<Entity, Long>`

**Bonus — Docker:**
```dockerfile
# Multi-stage build — dùng image có sẵn Maven để build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml ./
# Cache dependencies trước, tránh re-download khi code thay đổi
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
COPY --from=builder /build/target/resource-management-*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```yaml
docker-compose.yml:
  - app: spring boot (port 8080)
  - db: postgres:16-alpine (port 5432)
```

**Bonus — Swagger/OpenAPI:**
- Dùng `springdoc-openapi-starter-webmvc-ui`
- Access: http://localhost:8080/swagger-ui.html
- Annotations: `@Operation`, `@ApiResponse` cho mỗi endpoint

**Bonus — Unit Test:**
```yaml
Framework: JUnit 5 + Mockito
Coverage targets:
  - Service layer: 100% business rules
  - Controller: integration test với @WebMvcTest
  - Repository: @DataJpaTest với H2 in-memory
```

---

## Tổng Kết: Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────┐
│           Client (Postman / Web)         │
└──────────────────┬──────────────────────┘
                   │ HTTP REST
┌──────────────────▼──────────────────────┐
│         ┌──────────────────────────┐     │
│         │  Controller Layer        │     │
│         │  @RestController         │     │
│         │  /api/v1/employees       │     │
│         │  /api/v1/projects        │     │
│         │  /api/v1/allocations     │     │
│         │  /api/v1/ai             │     │
│         └──────────┬───────────────┘     │
│         ┌──────────▼───────────────┐     │
│         │  Service Layer            │     │
│         │  @Service @Transactional  │     │
│         │  @Version (optimistic)    │     │
│         │  - Allocation Validation  │     │
│         │  - Workload Calculation   │     │
│         │  - AI (Spring AI)         │     │
│         └──────────┬───────────────┘     │
│         ┌──────────▼───────────────┐     │
│         │  Repository Layer        │     │
│         │  JpaRepository           │     │
│         │  Custom @Query           │     │
│         └──────────┬───────────────┘     │
└────────────────────┬─────────────────────┘
                     │ JDBC
┌────────────────────▼─────────────────────┐
│         PostgreSQL Database               │
│         - employee                        │
│         - project                         │
│         - allocation                      │
└───────────────────────────────────────────┘
```

### Technology Stack Decision Matrix

| Component | Chọn | Lý do | Chi phí |
|-----------|------|-------|---------|
| Language | **Java 21** | LTS đến 2031, virtual threads, records, pattern matching | Free |
| Framework | **Spring Boot 3.3+** | Auto-config, Java 21 native support | Free |
| DB | **PostgreSQL 16** | ACID, FK, CHECK, sequences | Free |
| ORM | **Hibernate (Spring Data JPA)** | CRUD tự động, caching | Free |
| Build | **Maven** | Enterprise standard | Free |
| API Doc | **SpringDoc OpenAPI** | Chuẩn OpenAPI 3 | Free |
| Test | **JUnit 5 + Mockito** | Spring Boot starter test | Free |
| Logging | **Manual (SLF4J)** | Project nhỏ, chỉ 3 methods CRUD, không cần AOP | Free |
| Lock | **`@Version` Optimistic Lock** | Tỉ lệ conflict thấp, nhẹ, không cần quản lý lock | Free |
| AI | **Spring AI** | Abstraction layer cho LLM, output converter built-in | Free (trả API usage) |
| Container | **Docker** | Dev/prod consistency | Free |
| Version Control | **Git (GitHub)** | Team collaboration | Free |

---

> **Kết luận:** Tất cả technology đều được chọn dựa trên:
> 1. **Fit với requirement** — Spring Boot phù hợp cho REST CRUD, PostgreSQL phù hợp cho ACID transaction
> 2. **Enterprise standard** — Java 21/Spring Boot là stack hiện tại và phổ biến nhất cho outsourcing company
> 3. **Chi phí = 0** cho core stack (trừ optional AI feature tốn API usage)
> 4. **Khả năng scale** — Kiến trúc layer rõ ràng, có thể thêm tính năng mà không phá vỡ thiết kế
