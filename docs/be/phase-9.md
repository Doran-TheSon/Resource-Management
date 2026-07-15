# Phase 9 — Deliverables

> Mục tiêu: hoàn thiện các deliverable — Postman collection, API screenshots, Swagger UI verification.
>
> **Quan trọng:** trước khi làm deliverable, phải chạy được app. Nếu chưa build được, quay lại Phase 1-8.

---

## A. Chạy app

```bash
# Từ thư mục gốc
docker compose up --build
```

Đợi 30-60s, kiểm tra Swagger UI có response:

```
http://localhost:8080/swagger-ui.html
```

---

## B. Dữ liệu trong DB (seed data)

Khi app start, các record này đã có sẵn. Copy-paste các JSON này vào Postman/Swagger khi cần test.

### Employees

```json
// GET /api/v1/employees → trả về danh sách này:

[
  { "employeeId": 1, "employeeCode": "EMP001", "fullName": "Tuan Ho Anh",    "role": "Senior Developer", "department": "FSOFT-Q1" },
  { "employeeId": 2, "employeeCode": "EMP002", "fullName": "Le Thi Minh",     "role": "Developer",        "department": "FSOFT-Q1" },
  { "employeeId": 3, "employeeCode": "EMP003", "fullName": "Tran Van Nam",    "role": "Junior Developer",  "department": "FSOFT-Q2" },
  { "employeeId": 4, "employeeCode": "EMP004", "fullName": "Pham Thi Lan",    "role": "Tester",            "department": "FSOFT-Q1" }
]
```

### Projects

```json
// GET /api/v1/projects → trả về:

[
  { "projectId": 1, "projectCode": "NCG-001",  "projectName": "NCG Platform",      "customer": "NCG Corp",  "status": "ACTIVE" },
  { "projectId": 2, "projectCode": "GRID-001", "projectName": "Grid System",       "customer": "Grid Inc",  "status": "ACTIVE" },
  { "projectId": 3, "projectCode": "AI-001",   "projectName": "Internal AI Tool",  "customer": "Internal",  "status": "PLANNING" }
]
```

### Allocations (đã có sẵn)

```json
// GET /api/v1/employees/1/workload → trả về:

// Tuan Ho Anh   (ID=1): NCG 50% + Grid 30% = 80%  → còn 20%
// Le Thi Minh   (ID=2): NCG 80%                     → còn 20%
// Tran Van Nam  (ID=3): Grid 60%                    → còn 40%
// Pham Thi Lan  (ID=4): không có allocation nào      → trống 100%
```

---

## C. Swagger UI

Vào `http://localhost:8080/swagger-ui.html` → thấy 6 controllers. Mở `employee-controller` → `GET /api/v1/employees` → Try it out → Execute.

→ Chụp screenshot `screenshots/swagger-get-employees.png`

---

## D. Postman Collection — Từng request

Tạo collection tên **Resource Management API**, dùng variable `{{base_url}} = http://localhost:8080/api/v1`.

### Employees

**1. POST — Tạo employee mới** → 201

```
POST {{base_url}}/employees
Body → raw → JSON:
```
```json
{
  "employeeCode": "EMP005",
  "fullName": "Nguyen Van A",
  "email": "nguyenvana@company.com",
  "role": "Developer",
  "department": "FSOFT-Q3"
}
```

**2. POST — Duplicate employeeCode** → 409

```
POST {{base_url}}/employees
Body → raw → JSON:
```
```json
{
  "employeeCode": "EMP001",
  "fullName": "Test",
  "email": "test@company.com",
  "role": "Dev",
  "department": "FSOFT-Q1"
}
```
> EMP001 đã tồn tại → báo `EMPLOYEE_CODE_EXISTED`

**3. GET — Danh sách employees** → 200

```
GET {{base_url}}/employees
```

**4. GET — Employee theo ID** → 200

```
GET {{base_url}}/employees/1
```

**5. GET — Employee không tồn tại** → 404

```
GET {{base_url}}/employees/99
```

**6. PUT — Update employee ID=1** → 200

```
PUT {{base_url}}/employees/1
Body → raw → JSON:
```
```json
{
  "employeeCode": "EMP001",
  "fullName": "Tuan Ho Anh Updated",
  "email": "tuanha@company.com",
  "role": "Senior Developer",
  "department": "FSOFT-Q1"
}
```

**7. POST — Validation error (thiếu field)** → 400

```
POST {{base_url}}/employees
Body → raw → JSON:
```
```json
{
  "employeeCode": "",
  "fullName": "",
  "email": "abc",
  "role": "",
  "department": ""
}
```
> Trả về field errors: `fullName: "Full name is required"`, `email: "Invalid email format"`, ...

---

### Projects

**8. POST — Tạo project mới** → 201

```
POST {{base_url}}/projects
Body → raw → JSON:
```
```json
{
  "projectCode": "NEW-001",
  "projectName": "New Project",
  "customer": "New Customer",
  "status": "PLANNING",
  "startDate": "2026-07-01",
  "endDate": "2026-12-31"
}
```

**9. POST — Duplicate projectCode** → 409

```
POST {{base_url}}/projects
Body → raw → JSON:
```
```json
{
  "projectCode": "NCG-001",
  "projectName": "Duplicate",
  "customer": "X",
  "status": "PLANNING",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31"
}
```

**10. GET — Danh sách projects** → 200

```
GET {{base_url}}/projects
```

**11. PUT — Set project 1 thành COMPLETED** → 200

```
PUT {{base_url}}/projects/1
Body → raw → JSON:
```
```json
{
  "projectCode": "NCG-001",
  "projectName": "NCG Platform",
  "customer": "NCG Corp",
  "status": "COMPLETED",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```
> Cần set COMPLETED để test allocation vào project kết thúc ở bước sau.

---

### Allocations

**12. POST — Tạo allocation hợp lệ** → 201

```
POST {{base_url}}/allocations
Body → raw → JSON:
```
```json
{
  "employeeId": 3,
  "projectId": 3,
  "allocationPercent": 40,
  "roleInProject": "Backend Dev",
  "startDate": "2024-06-01",
  "endDate": "2024-11-30"
}
```
> Tran Van Nam (ID=3) đang 60% + 40% = 100% → được.

**13. POST — Vượt quá 100%** → 400

```
POST {{base_url}}/allocations
Body → raw → JSON:
```
```json
{
  "employeeId": 1,
  "projectId": 3,
  "allocationPercent": 60,
  "roleInProject": "Dev",
  "startDate": "2024-06-01",
  "endDate": "2024-11-30"
}
```
> Tuan Ho Anh (ID=1) đang 80% + 60% = 140% > 100% → `ALLOCATION_EXCEEDED`

**14. POST — Project đã COMPLETED** → 400

```
POST {{base_url}}/allocations
Body → raw → JSON:
```
```json
{
  "employeeId": 4,
  "projectId": 1,
  "allocationPercent": 50,
  "roleInProject": "Tester",
  "startDate": "2024-06-01",
  "endDate": "2024-11-30"
}
```
> Project 1 đã được set COMPLETED ở bước 11 → `PROJECT_COMPLETED`

**15. POST — Overlap thời gian** → 409

```
POST {{base_url}}/allocations
Body → raw → JSON:
```
```json
{
  "employeeId": 2,
  "projectId": 1,
  "allocationPercent": 10,
  "roleInProject": "Dev",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```
> Le Thi Minh (ID=2) đã có allocation ở project 1 trong khoảng 2024-01-01 → 2024-12-31, trùng khoảng thời gian → `ALLOCATION_OVERLAP`

**16. GET — Workload employee** → 200

```
GET {{base_url}}/employees/1/workload
```
> Trả về: totalAllocation = 80, available = 20, 2 allocations (NCG 50% + Grid 30%)

**17. GET — Workload employee không tồn tại** → 404

```
GET {{base_url}}/employees/99/workload
```

**18. PUT — Update allocation** → 200

```
PUT {{base_url}}/allocations/1
Body → raw → JSON:
```
```json
{
  "employeeId": 1,
  "projectId": 1,
  "allocationPercent": 60,
  "roleInProject": "Backend Dev Updated",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```
> Tuan Ho Anh: trừ 50% cũ, + 60% mới = 80% - 50% + 60% = 90% → được.

**19. DELETE — Xoá allocation** → 204

```
DELETE {{base_url}}/allocations/4
```
> Xoá allocation grid 60% của Tran Van Nam.

---

### Reports

**20. GET — Utilization report**

```
GET {{base_url}}/reports/utilization
```

**21. GET — Available resources**

```
GET {{base_url}}/reports/available-resources
```

**22. GET — Overloaded resources**

```
GET {{base_url}}/reports/overloaded
```

---

## E. Export Postman Collection

Chuột phải collection → **Export** → **Collection v2.1** → lưu thành `postman_collection.json` → copy vào thư mục gốc project.

---

## F. Screenshots

Tạo thư mục `screenshots/`. Dùng Postman gửi request → chụp màn hình. Mỗi ảnh phải thấy rõ **URL, Response body, Status code**.

| # | File | Request | Status |
|---|------|---------|--------|
| 1 | `swagger-get-employees.png` | Swagger: GET /employees | 200 |
| 2 | `employees/create-success.png` | POST EMP005 | 201 |
| 3 | `employees/create-duplicate.png` | POST EMP001 | 409 |
| 4 | `employees/list.png` | GET /employees | 200 |
| 5 | `employees/get-success.png` | GET /employees/1 | 200 |
| 6 | `employees/get-notfound.png` | GET /employees/99 | 404 |
| 7 | `employees/validation-error.png` | POST body trống | 400 |
| 8 | `projects/create-success.png` | POST NEW-001 | 201 |
| 9 | `projects/create-duplicate.png` | POST NCG-001 | 409 |
| 10 | `projects/list.png` | GET /projects | 200 |
| 11 | `allocations/create-success.png` | POST emp3-proj3 40% | 201 |
| 12 | `allocations/create-exceeded.png` | POST emp1 + 60% | 400 |
| 13 | `allocations/create-completed.png` | POST emp4-proj1 (COMPLETED) | 400 |
| 14 | `allocations/create-overlap.png` | POST emp2-proj1 overlap | 409 |
| 15 | `workload/success.png` | GET /employees/1/workload | 200 |
| 16 | `workload/notfound.png` | GET /employees/99/workload | 404 |
| 17 | `reports/utilization.png` | GET /reports/utilization | 200 |
| 18 | `reports/available-resources.png` | GET /reports/available-resources | 200 |
| 19 | `reports/overloaded.png` | GET /reports/overloaded | 200 |

> **Important:** DELETE trả về **204 No Content**, hoàn toàn không có body — chụp screenshot postman sẽ thấy status 204, response body trống.

---

## G. Checklist cuối cùng

- [ ] POST /employees — tạo EMP005 → 201
- [ ] POST /employees — duplicate EMP001 → 409
- [ ] GET /employees → 200
- [ ] GET /employees/1 → 200
- [ ] GET /employees/99 → 404
- [ ] POST /projects — tạo NEW-001 → 201
- [ ] POST /projects — duplicate NCG-001 → 409
- [ ] GET /projects → 200
- [ ] PUT /projects/1 → set COMPLETED → 200
- [ ] POST /allocations — hợp lệ → 201
- [ ] POST /allocations — vượt 100% → 400 `ALLOCATION_EXCEEDED`
- [ ] POST /allocations — COMPLETED → 400 `PROJECT_COMPLETED`
- [ ] POST /allocations — overlap → 409 `ALLOCATION_OVERLAP`
- [ ] GET /employees/1/workload → total 80%
- [ ] PUT /allocations/1 — update → 200
- [ ] DELETE /allocations/4 → 204
- [ ] GET /reports/utilization → 200
- [ ] POST validation fail → 400 + field errors
- [ ] `postman_collection.json` export
- [ ] 19 screenshots
- [ ] `mvn test` — green
