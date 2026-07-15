# Database Design

> Thiết kế cơ sở dữ liệu cho Resource Management System — mô tả entities, relationships, constraints, indexes.

---

## 1. Entity Relationship Diagram (ERD)

```
┌───────────────────┐       ┌──────────────────────┐       ┌───────────────────┐
│     Employee      │       │      Allocation       │       │     Project       │
├───────────────────┤       ├──────────────────────┤       ├───────────────────┤
│ PK │ employee_id  │◄──────│FK│ employee_id        │       │ PK │ project_id   │
│     employee_code │       │PK │ allocation_id      │       │     project_code │
│     full_name     │       │FK │ project_id        │──────►│     project_name │
│     email         │       │    allocation_percent │       │     customer     │
│     role          │       │    role_in_project    │       │     status       │
│     department    │       │    start_date         │       │     start_date   │
│     created_at    │       │    end_date           │       │     end_date     │
│     updated_at    │       │    version (@Version) │       │     created_at   │
└───────────────────┘       │    created_at         │       │     updated_at   │
                            │    updated_at         │       └───────────────────┘
                            └──────────────────────┘
```

### Relationships
- **Employee** (1) ──── (*) **Allocation**: Một nhân viên có nhiều allocation (nhiều dự án)
- **Project** (1) ──── (*) **Allocation**: Một dự án có nhiều allocation (nhiều nhân viên)
- **Allocation** là bảng trung gian (junction table) kết nối Employee và Project

---

## 2. Tables

### 2.1 `employee` — Nhân viên

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `employee_id` | `BIGSERIAL` | `PK` | ID tự tăng |
| `employee_code` | `VARCHAR(20)` | `UNIQUE, NOT NULL` | Mã nhân viên (VD: EMP001) |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | Họ tên đầy đủ |
| `email` | `VARCHAR(100)` | `NOT NULL` | Email |
| `role` | `VARCHAR(50)` | `NOT NULL` | Chức danh (VD: Senior Developer) |
| `department` | `VARCHAR(50)` | `NOT NULL` | Phòng ban (VD: FSOFT-Q1) |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời gian tạo |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời gian cập nhật |

**Index:**
```sql
CREATE INDEX idx_employee_code ON employee(employee_code);
```

### 2.2 `project` — Dự án

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `project_id` | `BIGSERIAL` | `PK` | ID tự tăng |
| `project_code` | `VARCHAR(20)` | `UNIQUE, NOT NULL` | Mã dự án (VD: NCG-001) |
| `project_name` | `VARCHAR(200)` | `NOT NULL` | Tên dự án |
| `customer` | `VARCHAR(100)` | `NOT NULL` | Tên khách hàng |
| `status` | `VARCHAR(20)` | `NOT NULL` | Trạng thái: PLANNING / ACTIVE / COMPLETED |
| `start_date` | `DATE` | `NOT NULL` | Ngày bắt đầu |
| `end_date` | `DATE` | nullable | Ngày kết thúc |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời gian tạo |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời gian cập nhật |

**Index:**
```sql
CREATE INDEX idx_project_status ON project(status);
```

### 2.3 `allocation` — Phân bổ nhân sự

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `allocation_id` | `BIGSERIAL` | `PK` | ID tự tăng |
| `employee_id` | `BIGINT` | `FK → employee, NOT NULL` | ID nhân viên |
| `project_id` | `BIGINT` | `FK → project, NOT NULL` | ID dự án |
| `allocation_percent` | `INTEGER` | `CHECK (1-100), NOT NULL` | % thời gian phân bổ |
| `role_in_project` | `VARCHAR(100)` | nullable | Vai trò trong dự án |
| `start_date` | `DATE` | `NOT NULL` | Ngày bắt đầu |
| `end_date` | `DATE` | `NOT NULL` | Ngày kết thúc |
| `version` | `BIGINT` | `NOT NULL, DEFAULT 0` | Optimistic lock version |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời gian tạo |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời gian cập nhật |

**Constraints:**
```sql
-- FK: allocation → employee
ALTER TABLE allocation ADD CONSTRAINT fk_allocation_employee
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id);

-- FK: allocation → project
ALTER TABLE allocation ADD CONSTRAINT fk_allocation_project
    FOREIGN KEY (project_id) REFERENCES project(project_id);

-- Unique: tránh duplicate allocation cùng employee + project + thời gian
ALTER TABLE allocation ADD CONSTRAINT uq_allocation_emp_project_start
    UNIQUE (employee_id, project_id, start_date);

-- Check: allocation trong khoảng 1-100% (không cho phép 0% — dead data)
-- Đã có: allocation_percent INTEGER NOT NULL CHECK (allocation_percent > 0 AND allocation_percent <= 100)
```

**Indexes:**
```sql
CREATE INDEX idx_allocation_employee ON allocation(employee_id);
CREATE INDEX idx_allocation_project ON allocation(project_id);
```

---

## 3. Business Rules trong DB

| Rule | Implementation | Level |
|------|---------------|-------|
| `0 < allocation ≤ 100%` | `CHECK` constraint | Database |
| `allocation_percent > 0` | `CHECK` constraint | Database |
| `employee_code UNIQUE` | `UNIQUE` constraint | Database |
| `project_code UNIQUE` | `UNIQUE` constraint | Database |
| Không trùng allocation (cùng emp, project, start_date) | `UNIQUE` constraint | Database |
| Khóa ngoại employee_id | `FOREIGN KEY` | Database |
| Khóa ngoại project_id | `FOREIGN KEY` | Database |
| **Tổng allocation ≤ 100%** | **Java Service Layer** | Application |
| **Không allocate vào COMPLETED project** | **Java Service Layer** | Application |
| **endDate ≥ startDate** | **Java Service Layer** | Application |
| **Overlap time check** | **JPQL query** | Application |
| **Optimistic Lock** | `@Version` | Application |

> **Giải thích:** Ràng buộc tổng ≤ 100% không thể implement bằng `CHECK` constraint vì nó cần tính `SUM` trên nhiều dòng.
> Optimistic Lock (`@Version`) giải quyết race condition khi 2 request allocate cùng lúc.

---

## 4. Key SQL Queries

### Utilization Report (LEFT JOIN — giữ cả employee chưa allocate)
```sql
SELECT e.employee_id, e.full_name, COALESCE(SUM(a.allocation_percent), 0)
FROM employee e
LEFT JOIN allocation a ON e.employee_id = a.employee_id
GROUP BY e.employee_id, e.full_name
ORDER BY e.full_name ASC;
```

### Available Resources (total < 100%)
```sql
SELECT e.employee_id, e.full_name, COALESCE(SUM(a.allocation_percent), 0)
FROM employee e
LEFT JOIN allocation a ON e.employee_id = a.employee_id
GROUP BY e.employee_id, e.full_name
HAVING COALESCE(SUM(a.allocation_percent), 0) < 100
ORDER BY e.full_name ASC;
```

### Overloaded Resources (total > 90%)
```sql
SELECT e.employee_id, e.full_name, COALESCE(SUM(a.allocation_percent), 0)
FROM employee e
LEFT JOIN allocation a ON e.employee_id = a.employee_id
GROUP BY e.employee_id, e.full_name
HAVING COALESCE(SUM(a.allocation_percent), 0) > 90
ORDER BY e.full_name ASC;
```

### Overlap Check (cùng employee, cùng project, trùng thời gian)
```sql
SELECT COUNT(a) > 0
FROM allocation a
WHERE a.employee_id = :empId
  AND a.project_id = :projectId
  AND a.start_date < :endDate
  AND a.end_date > :startDate
  AND (:excludeId IS NULL OR a.allocation_id <> :excludeId);
```

---

## 5. Seed Data

4 employees, 3 projects, 4 allocations:

| Employee | Role | Allocations | Total |
|----------|------|-------------|-------|
| Tuan Ho Anh | Senior Developer | NCG 50% + Grid 30% | 80% |
| Le Thi Minh | Developer | NCG 80% | 80% |
| Tran Van Nam | Junior Developer | Grid 60% | 60% |
| Pham Thi Lan | Tester | — | 0% |

---

## 6. Migration Strategy

Dùng **Flyway** với naming convention:

```
V1__init_schema.sql     → Create tables + constraints + indexes
V2__seed_data.sql       → Insert dữ liệu mẫu
```

**Rules:**
- Migration đã merge → **KHÔNG SỬA**. Tạo file mới nếu cần thay đổi schema.
- Hibernate `ddl-auto = validate` — chỉ validate, không tự tạo schema.
- DB schema là single source of truth (qua Flyway).
