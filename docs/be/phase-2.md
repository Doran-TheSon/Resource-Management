# Phase 2 — Entity & DB

> Mục tiêu: tạo JPA entities, schema SQL, seed data.

---

## Việc cần làm

### 1. Tạo package structure

```
be/src/main/java/com/resourcemanagement/
  ├── model/
  │   ├── entity/
  │   │   ├── Employee.java
  │   │   ├── Project.java
  │   │   └── Allocation.java
  │   └── enums/
  │       └── ProjectStatus.java
```

### 2. Tạo enum `ProjectStatus`

```java
package com.resourcemanagement.model.enums;

public enum ProjectStatus {
    PLANNING,
    ACTIVE,
    COMPLETED
}
```

### 3. Tạo entity `Employee`

```java
package com.resourcemanagement.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long employeeId;

    @Column(name = "employee_code", unique = true, nullable = false, length = 20)
    private String employeeCode;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 50)
    private String role;

    @Column(nullable = false, length = 50)
    private String department;

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

### 4. Tạo entity `Project`

```java
package com.resourcemanagement.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "project")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projectId;

    @Column(name = "project_code", unique = true, nullable = false, length = 20)
    private String projectCode;

    @Column(name = "project_name", nullable = false, length = 200)
    private String projectName;

    @Column(nullable = false, length = 100)
    private String customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

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

### 5. Tạo entity `Allocation`

```java
package com.resourcemanagement.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "allocation")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Allocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long allocationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "allocation_percent", nullable = false)
    private Integer allocationPercent;

    @Column(name = "role_in_project", length = 100)
    private String roleInProject;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

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

### 6. Tạo `schema.sql`

`be/src/main/resources/schema.sql` — dùng cho profile `prod` (ddl-auto=validate cần schema sẵn):

```sql
CREATE TABLE IF NOT EXISTS employee (
    employee_id BIGSERIAL PRIMARY KEY,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project (
    project_id BIGSERIAL PRIMARY KEY,
    project_code VARCHAR(20) NOT NULL UNIQUE,
    project_name VARCHAR(200) NOT NULL,
    customer VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS allocation (
    allocation_id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    allocation_percent INTEGER NOT NULL CHECK (allocation_percent > 0 AND allocation_percent <= 100),
    role_in_project VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FK constraints
ALTER TABLE allocation ADD CONSTRAINT IF NOT EXISTS fk_allocation_employee
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id);
ALTER TABLE allocation ADD CONSTRAINT IF NOT EXISTS fk_allocation_project
    FOREIGN KEY (project_id) REFERENCES project(project_id);

-- Unique constraints
ALTER TABLE allocation ADD CONSTRAINT IF NOT EXISTS uq_allocation_emp_project_start
    UNIQUE (employee_id, project_id, start_date);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_code ON employee(employee_code);
CREATE INDEX IF NOT EXISTS idx_project_status ON project(status);
CREATE INDEX IF NOT EXISTS idx_allocation_employee ON allocation(employee_id);
CREATE INDEX IF NOT EXISTS idx_allocation_project ON allocation(project_id);
```

### 7. Tạo `data.sql` (seed data)

`be/src/main/resources/data.sql` — dùng cho dev profile (H2):

```sql
INSERT INTO employee (employee_code, full_name, email, role, department, created_at, updated_at)
VALUES
('EMP001', 'Tuan Ho Anh', 'tuanha@company.com', 'Senior Developer', 'FSOFT-Q1', NOW(), NOW()),
('EMP002', 'Le Thi Minh', 'minhlt@company.com', 'Developer', 'FSOFT-Q1', NOW(), NOW()),
('EMP003', 'Tran Van Nam', 'namtv@company.com', 'Junior Developer', 'FSOFT-Q2', NOW(), NOW()),
('EMP004', 'Pham Thi Lan', 'lanpt@company.com', 'Tester', 'FSOFT-Q1', NOW(), NOW());

INSERT INTO project (project_code, project_name, customer, status, start_date, end_date, created_at, updated_at)
VALUES
('NCG-001', 'NCG Platform', 'NCG Corp', 'ACTIVE', '2024-01-01', '2024-12-31', NOW(), NOW()),
('GRID-001', 'Grid System', 'Grid Inc', 'ACTIVE', '2024-03-01', '2025-02-28', NOW(), NOW()),
('AI-001', 'Internal AI Tool', 'Internal', 'PLANNING', '2024-06-01', '2024-11-30', NOW(), NOW());

INSERT INTO allocation (employee_id, project_id, allocation_percent, role_in_project, start_date, end_date, version, created_at, updated_at)
VALUES
(1, 1, 50, 'Backend Developer', '2024-01-01', '2024-12-31', 0, NOW(), NOW()),
(1, 2, 30, 'Tech Lead', '2024-03-01', '2024-12-31', 0, NOW(), NOW()),
(2, 1, 80, 'Fullstack Developer', '2024-01-01', '2024-12-31', 0, NOW(), NOW()),
(3, 2, 60, 'Frontend Developer', '2024-03-01', '2024-12-31', 0, NOW(), NOW());
```

### 8. Cập nhật `application-dev.yml`

Thêm dòng để H2 tự chạy `data.sql` khi start:

```yaml
spring:
  sql:
    init:
      mode: always
```

---

## Kết quả sau phase 2

- 3 entities + 1 enum trong package `model`
- `schema.sql` có đủ FK, index, unique, check constraint
- `data.sql` có 4 employees + 3 projects + 4 allocations mẫu
- Build thành công `mvn compile`
