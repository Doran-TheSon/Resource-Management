# Phase 8 — Testing

> Mục tiêu: unit test Service layer (business rules), integration test Controller + Repository.

---

## Việc cần làm

### 1. Cấu hình test

`src/test/resources/application-test.yml`

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
```

### 2. Unit test — `AllocationServiceTest`

`src/test/java/com/resourcemanagement/service/AllocationServiceTest.java`

Test các business rules:

| # | Test case | Expected |
|---|-----------|----------|
| 1 | Tạo allocation hợp lệ | Thành công, trả về AllocationResponse |
| 2 | Tổng > 100% | Throw AllocationExceededException |
| 3 | Allocate vào COMPLETED project | Throw ProjectCompletedException |
| 4 | startDate < project.startDate | Throw InvalidDateRangeException |
| 5 | endDate < startDate | Throw InvalidDateRangeException |
| 6 | Trùng thời gian (overlap) | Throw AllocationOverlapException |
| 7 | Employee không tồn tại | Throw EmployeeNotFoundException |
| 8 | Project không tồn tại | Throw ProjectNotFoundException |
| 9 | Update: trừ cũ + thêm mới > 100% | Throw AllocationExceededException |
| 10 | allocationPercent = 1 (min) | Thành công |
| 11 | allocationPercent = 100 (max) | Thành công |
| 12 | Xoá allocation tồn tại | Thành công, không throw |
| 13 | Xoá allocation không tồn tại | Throw AllocationNotFoundException |

### 3. Unit test — `EmployeeServiceTest`

| # | Test case | Expected |
|---|-----------|----------|
| 1 | Tạo employee hợp lệ | Thành công |
| 2 | Tạo với employeeCode đã tồn tại | Throw EmployeeCodeExistedException |
| 3 | GET employee không tồn tại | Throw EmployeeNotFoundException |
| 4 | Update employee tồn tại | Thành công |

### 4. Unit test — `ProjectServiceTest`

| # | Test case | Expected |
|---|-----------|----------|
| 1 | Tạo project hợp lệ | Thành công |
| 2 | Tạo với projectCode đã tồn tại | Throw ProjectCodeExistedException |
| 3 | endDate < startDate | Throw InvalidDateRangeException |

### 5. Integration test — Controller

`src/test/java/com/resourcemanagement/controller/EmployeeControllerTest.java`

Dùng `@WebMvcTest` + `MockMvc`:

| # | Test case | Expected status |
|---|-----------|----------------|
| 1 | GET /api/v1/employees | 200 + list |
| 2 | GET /api/v1/employees/{id} tồn tại | 200 |
| 3 | GET /api/v1/employees/{id} không tồn tại | 404 |
| 4 | POST /api/v1/employees hợp lệ | 201 |
| 5 | POST /api/v1/employees thiếu field | 400 + field errors |

### 6. Integration test — Repository

`src/test/java/com/resourcemanagement/repository/AllocationRepositoryTest.java`

Dùng `@DataJpaTest` + H2:

| # | Test case | Expected |
|---|-----------|----------|
| 1 | getTotalAllocationByEmployee | SUM đúng |
| 2 | existsOverlappingAllocation | true nếu overlap |
| 3 | findUtilizationReport | LEFT JOIN giữ employee không allocate |

### 7. Chạy test

```bash
cd be
mvn test
```

---

## Kết quả sau phase 8

- ~30 test cases
- Coverage: 100% business rules AllocationService, EmployeeService, ProjectService
- Integration test: Controller endpoints + Repository queries
- `mvn test` — green
