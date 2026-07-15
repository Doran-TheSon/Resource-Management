# Phase 1 — Khởi tạo project

> Mục tiêu: thiết lập project skeleton, đủ dependencies, cấu hình PostgreSQL, có pgAdmin để xem dữ liệu.

---

## Việc cần làm

### 1. Cập nhật `be/pom.xml`

Dependencies cần có:

| Dependency | Scope | Lý do |
|-----------|-------|-------|
| `spring-boot-starter-web` | compile | REST API |
| `spring-boot-starter-data-jpa` | compile | JPA + Hibernate |
| `spring-boot-starter-validation` | compile | `@Valid`, `@NotBlank`, ... |
| `postgresql` | **runtime** | Driver PostgreSQL |
| `lombok` | optional | Boilerplate |
| `springdoc-openapi-starter-webmvc-ui:2.8.6` | compile | Swagger UI |
| `h2` | **test** | Chỉ dùng cho test với `@DataJpaTest` |
| `spring-boot-starter-test` | test | JUnit 5 + Mockito |

> **Không dùng H2 cho dev** — dev chạy Docker, xài PostgreSQL thật luôn. H2 chỉ để test.

Xoá comment `<!-- MySQL -->` và block H2 runtime.

### 2. Cấu hình

**`application.yml`** (default — chạy local, cần PostgreSQL chạy ở localhost):

```yaml
server:
  port: 8080

spring:
  application:
    name: resource-management
  datasource:
    url: jdbc:postgresql://localhost:5432/resource_management
    driver-class-name: org.postgresql.Driver
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

logging:
  level:
    com.resourcemanagement: DEBUG
    org.springframework: INFO
```

**`application-docker.yml`** — ghi đè host DB khi chạy Docker Compose:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/resource_management
  jpa:
    show-sql: false

logging:
  level:
    com.resourcemanagement: INFO
    org.springframework: WARN
```

> Chỉ khác nhau cái host: `localhost` vs `db` (tên service trong docker-compose).
> Không cần profile `dev` — ai muốn chạy local thì dùng default.

### 3. Docker Compose

| Service | Image | Port | Chức năng |
|---------|-------|------|-----------|
| `be` | tự build | `8080` | Spring Boot |
| `fe` | tự build | `5173` | React (giữ nguyên) |
| `db` | `postgres:16-alpine` | `5432` | PostgreSQL, volume persist + health check |
| `pgadmin` | `dpage/pgadmin4:latest` | `5050` | Web xem/soạn dữ liệu, login `admin@rm.com` / `admin` |

Service `be` dùng `SPRING_PROFILES_ACTIVE=docker` và `depends_on: db: condition: service_healthy`.

### 4. Cập nhật `.gitignore`

Thêm `pgadmin-data/`.

### 5. Cập nhật `README.md`

Hướng dẫn chạy:

```bash
# Chạy full stack
docker compose up --build

# Health check
curl http://localhost:8080/api/health

# Swagger
http://localhost:8080/swagger-ui.html

# pgAdmin
http://localhost:5050   # admin@rm.com / admin
```

---

## Kết quả sau phase 1

```
docker-compose.yml     ← thêm db + pgadmin
be/
  pom.xml              ← PostgreSQL + SpringDoc, H2 chỉ test
  Dockerfile           ← không đổi
  src/main/resources/
    application.yml         ← default (PostgreSQL localhost)
    application-docker.yml  ← Docker (PostgreSQL db:5432)
.gitignore             ← thêm pgadmin-data/
```

App chạy được bằng `docker compose up`:
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- pgAdmin: `http://localhost:5050`
