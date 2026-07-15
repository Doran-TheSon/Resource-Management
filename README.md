# Resource Management System

Hệ thống quản lý phân bổ nhân sự (Resource Allocation) cho công ty outsourcing — cho phép PM/Resource Manager quản lý nhân viên, dự án, phân bổ thời gian và theo dõi workload.

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Backend** | Java 21, Spring Boot 3.4.4, Spring Data JPA, Maven |
| **Frontend** | React 19, Vite 8, React Router v7 |
| **Database** | PostgreSQL 16 (cả dev lẫn prod) |
| **Migration** | Flyway |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) |
| **AI** | OpenRouter (openai/gpt-4o-mini, google/gemma-4-31b:free) hoặc Google Gemini |
| **Container** | Docker, docker-compose |

---

## Project Structure

```
Resource-Management/
├── be/                          # Backend (Java Spring Boot)
│   ├── src/main/java/
│   │   └── com/resourcemanagement/
│   │       ├── ai/              # AI Integration (OpenRouter / Gemini)
│   │       ├── controller/      # REST API controllers
│   │       ├── service/         # Business logic layer
│   │       ├── repository/      # JPA repositories
│   │       ├── model/           # JPA entities
│   │       ├── dto/             # Request/Response DTOs
│   │       ├── exception/       # Custom exceptions + handler
│   │       └── config/          # App config (CORS)
│   ├── src/main/resources/
│   │   ├── application.yml          # Local config
│   │   ├── application-docker.yml   # Docker config
│   │   └── db/migration/            # Flyway SQL migrations
│   ├── .env                     # Environment variables (gitignored)
│   ├── .env.example             # Mẫu env vars
│   └── Dockerfile               # Multi-stage build
├── fe/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/                 # API client layer
│   │   ├── components/          # Shared components
│   │   │   ├── layout/          # AppLayout, Sidebar, Header
│   │   │   └── common/          # DataTable, FormField, Toast, etc.
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom hooks
│   │   ├── utils/               # Constants, validators, formatters
│   │   └── styles/              # CSS theme, animations
│   └── Dockerfile               # Multi-stage build
├── docs/
│   ├── requirements-analysis.md # Phân tích & quyết định triển khai
│   ├── be/                      # BE implementation docs
│   ├── fe/                      # FE architecture & mapping docs
│   ├── db/                      # Database design
│   └── AIIntegrate/             # AI integration architecture
├── docker-compose.yml           # BE + FE + DB + pgAdmin
├── Project_Resource_Allocation_Assignment.md
└── README.md
```

---

## Yêu cầu

| Tool | Version | Ghi chú |
|------|---------|---------|
| Java | 21+ | Kiểm tra: `java --version` |
| Maven | 3.9+ | Kiểm tra: `mvn --version` |
| Node.js | 20+ | Kiểm tra: `node --version` |
| Docker | 24+ | _(optional)_ Kiểm tra: `docker --version` |
| API Key | — | OpenRouter hoặc Google Gemini |

---

## Cài đặt & Cấu hình

### 1. Clone project

```bash
git clone <repo-url>
cd Resource-Management
```

### 2. Setup API Key (bắt buộc cho AI features)

```bash
# Copy file env mẫu
cp be/.env.example be/.env
```

Sửa file `be/.env`:

```bash
# Đăng ký key tại: https://openrouter.ai/keys
GEMINI_API_KEY=sk-or-v1-your-key-here

# Model mặc định (optional)
AI_MODEL=google/gemma-4-31b:free
```

**Chọn provider:**
| Provider | Key prefix | Đăng ký |
|----------|-----------|---------|
| **OpenRouter** (khuyên dùng) | `sk-or-...` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Google Gemini** | `AIza...` | [aistudio.google.com](https://aistudio.google.com/apikey) |

### 3. Chạy bằng Docker (khuyên dùng)

```bash
# Build & start full stack
docker compose up --build

# Hoặc chạy ngầm
docker compose up --build -d

# Xem log
docker compose logs -f
```

### 4. Hoặc chạy thủ công (cần PostgreSQL riêng)

```bash
# Terminal 1: Backend
cd be
mvn spring-boot:run

# Terminal 2: Frontend
cd fe
npm install
npm run dev
```

---

## Services

| Service | URL | Ghi chú |
|---------|-----|---------|
| Backend API | http://localhost:8080 | Spring Boot |
| Swagger UI | http://localhost:8080/swagger-ui.html | API docs |
| Frontend | http://localhost:5173 | React app |
| pgAdmin | http://localhost:5050 | `admin@rm.com` / `admin` |
| PostgreSQL | localhost:5432 | internal |

---

## Environment Variables

File: `be/.env`

| Variable | Required | Default | Mô tả |
|----------|----------|---------|-------|
| `GEMINI_API_KEY` | ✅ **Yes** | — | API key. Prefix `sk-or-` = OpenRouter, `AIza-` = Gemini |
| `AI_MODEL` | ❌ No | `google/gemma-4-31b:free` | Model name (chỉ OpenRouter). Xem [openrouter.ai/models](https://openrouter.ai/models) |

---

## API Endpoints

Tất cả endpoints có prefix `/api/v1/...` (ví dụ: `http://localhost:8080/api/v1/employees`).

### Employee

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/employees` | Tạo nhân viên |
| GET | `/employees` | Danh sách (filter: `?department=&role=&page=&size=`) |
| GET | `/employees/{id}` | Chi tiết |
| PUT | `/employees/{id}` | Cập nhật |

### Project

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/projects` | Tạo dự án |
| GET | `/projects` | Danh sách (filter: `?status=&customer=`) |
| GET | `/projects/{id}` | Chi tiết |
| PUT | `/projects/{id}` | Cập nhật |

### Allocation

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/allocations` | Tạo allocation |
| GET | `/allocations` | Danh sách tất cả |
| GET | `/allocations/{id}` | Chi tiết |
| PUT | `/allocations/{id}` | Cập nhật |
| DELETE | `/allocations/{id}` | Xóa |
| GET | `/employees/{id}/workload` | Workload nhân viên |

### Reports

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/reports/utilization` | Báo cáo utilization |
| GET | `/reports/available-resources` | Nhân viên còn available |
| GET | `/reports/overloaded` | Nhân viên quá tải |

### AI

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/ai/recommend` | Gợi ý resource theo ngôn ngữ tự nhiên |
| POST | `/ai/risk-analysis` | Phân tích rủi ro capacity |

> **Cách hoạt động:**
> 1. LLM (OpenRouter/Gemini) phân tích câu hỏi ngôn ngữ tự nhiên → trích xuất tham số
> 2. Java query DB bằng Repository (AI **KHÔNG** tự query DB)
> 3. LLM hoặc Java sinh explanation
>
> Có **3 tầng fallback**: LLM → LLM retry → Java regex (xem chi tiết tại `docs/AIIntegrate/AIIntegrate.md`)

**Ví dụ:**
```bash
# AI Recommend
curl -X POST http://localhost:8080/api/v1/ai/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "Tìm Java Developer còn tối thiểu 50% available"}'

# AI Risk Analysis
curl -X POST http://localhost:8080/api/v1/ai/risk-analysis \
  -H "Content-Type: application/json" \
  -d '{"query": "Sprint tới cần thêm 2 Java Developer"}'
```

---

## Business Rules

1. **0 < allocation <= 100%** — allocation phải từ 1% đến 100%
2. **Tổng allocation ≤ 100%** — 1 employee không thể làm quá 100% thời gian
3. **Không allocate vào COMPLETED project** — dự án đã kết thúc
4. **endDate >= startDate** — date range hợp lệ
5. **Không overlap** — không 2 allocation trùng thời gian cùng employee + project

## Entity Relationship

```
Employee (1) ──── (*) Allocation (*) ──── (1) Project
```

Xem chi tiết tại [docs/db/DBDesign.md](docs/db/DBDesign.md)

---

## Documents

| File | Mô tả |
|------|-------|
| [docs/requirements-analysis.md](docs/requirements-analysis.md) | Phân tích yêu cầu & quyết định triển khai |
| [docs/db/DBDesign.md](docs/db/DBDesign.md) | Database design chi tiết |
| [docs/AIIntegrate/AIIntegrate.md](docs/AIIntegrate/AIIntegrate.md) | AI integration architecture & fallback |
| [docs/fe/fe-mapping-doc.md](docs/fe/fe-mapping-doc.md) | FE-BE mapping |
| [docs/fe/architecture.md](docs/fe/architecture.md) | FE architecture |
| [docs/fe/screen.md](docs/fe/screen.md) | Screen specifications |
| [Project_Resource_Allocation_Assignment.md](Project_Resource_Allocation_Assignment.md) | Yêu cầu gốc |

---

## Commit Convention

```
type(scope): message
```

- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Tài liệu
- `refactor`: Refactor code
- `test`: Test

---

## Deliverables

- [x] Source Code Git Repository
- [x] SQL Script Create Table
- [x] README.md
- [x] Database Design Document
- [x] AI Integration Document
- [x] Frontend Architecture & Mapping
- [ ] Postman Collection
- [ ] API Screenshot
- [ ] AI Review Report
