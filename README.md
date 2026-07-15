# Resource Management System

Hệ thống quản lý phân bổ nhân sự (Resource Allocation) cho công ty outsourcing — cho phép PM/Resource Manager quản lý nhân viên, dự án, phân bổ thời gian và theo dõi workload.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Backend** | Java 21, Spring Boot 3.4.4, Spring Data JPA, Maven |
| **Frontend** | React 19, Vite 8 |
| **Database** | H2 (dev), PostgreSQL (production) |
| **Container** | Docker, docker-compose |

## Project Structure

```
Resource-Management/
├── be/                          # Backend (Java Spring Boot)
│   ├── src/main/java/
│   │   └── com/resourcemanagement/
│   │       ├── controller/      # REST API controllers
│   │       ├── service/         # Business logic layer
│   │       ├── repository/      # JPA repositories
│   │       ├── model/           # JPA entities
│   │       ├── dto/             # Request/Response DTOs
│   │       ├── exception/       # Custom exceptions + handler
│   │       └── config/          # App config (CORS, ...)
│   ├── src/main/resources/
│   │   ├── application.yml      # Dev config (H2)
│   │   └── application-docker.yml  # Docker config
│   └── Dockerfile               # Multi-stage build
├── fe/                          # Frontend (React + Vite)
│   ├── src/                     # React source
│   └── Dockerfile               # Multi-stage build
├── docs/
│   └── requirements-analysis.md # Phân tích & quyết định triển khai
├── docker-compose.yml           # BE + FE orchestration
├── Project_Resource_Allocation_Assignment.md  # Yêu cầu gốc
└── .gitignore
```

## Cách chạy

### Yêu cầu

- Java 21+
- Maven 3.9+
- Node.js 20+ (cho FE)
- Docker & docker-compose (optional)

### Chạy Backend (development)

```bash
cd be
mvn spring-boot:run
```

API: http://localhost:8080/api

H2 Console: http://localhost:8080/h2-console (JDBC URL: `jdbc:h2:mem:resource_management`)

### Chạy Frontend (development)

```bash
cd fe
npm install
npm run dev
```

Web: http://localhost:5173

### Chạy bằng Docker (cả BE + FE)

```bash
docker compose up --build
```

- Backend: http://localhost:8080/api
- Frontend: http://localhost:5173

## API Endpoints

### Employee

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST   | `/api/employees` | Tạo nhân viên |
| GET    | `/api/employees` | Danh sách nhân viên |
| GET    | `/api/employees/{id}` | Chi tiết nhân viên |
| PUT    | `/api/employees/{id}` | Cập nhật nhân viên |

### Project

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST   | `/api/projects` | Tạo dự án |
| GET    | `/api/projects` | Danh sách dự án |
| GET    | `/api/projects/{id}` | Chi tiết dự án |
| PUT    | `/api/projects/{id}` | Cập nhật dự án |

### Allocation

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST   | `/api/allocations` | Tạo allocation |
| PUT    | `/api/allocations/{id}` | Cập nhật allocation |
| DELETE | `/api/allocations/{id}` | Xóa allocation |
| GET    | `/api/employees/{id}/workload` | Workload nhân viên |

### Reports

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET    | `/api/reports/utilization` | Báo cáo utilization |
| GET    | `/api/reports/available-resources` | Nhân viên còn available |
| GET    | `/api/reports/overloaded` | Nhân viên quá tải |

### AI

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST   | `/api/ai/recommend` | Gợi ý resource (AI) |
| POST   | `/api/ai/risk-analysis` | Phân tích rủi ro (AI) |

### Health

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET    | `/api/health` | Health check |

## Business Rules

1. **0 < allocation <= 100** — allocation phải từ 1% đến 100%
2. **Tổng allocation ≤ 100%** — 1 employee không thể làm quá 100% thời gian
3. **Không allocate vào COMPLETED project** — dự án đã kết thúc

## Entity Relationship

```
Employee (1) ──── (*) Allocation (*) ──── (1) Project
```

## Commit Convention

```
type(scope): message
```

- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Tài liệu
- `refactor`: Refactor code
- `test`: Test

## Deliverables

- [x] Source Code Git Repository
- [x] SQL Script Create Table
- [x] README.md
- [ ] Postman Collection
- [ ] API Screenshot
- [ ] AI Review Report
