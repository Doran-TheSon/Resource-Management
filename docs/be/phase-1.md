# Giai đoạn 1 — Khởi tạo project

> Mục tiêu: thiết lập project skeleton, đủ dependencies, cấu hình DB PostgreSQL cả local lẫn Docker, có pgAdmin để xem dữ liệu.

---

## Việc cần làm

### 1. Cập nhật `be/pom.xml`

Thêm 2 dependency còn thiếu:

| Dependency | Lý do |
|-----------|-------|
| `org.postgresql:postgresql` (scope runtime) | Driver kết nối PostgreSQL |
| `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6` | Swagger UI tự động từ OpenAPI 3 |

Xoá comment `<!-- MySQL -->` và dùng PostgreSQL thay thế.

### 2. Tách profile cấu hình

- **`application.yml`** — chỉ giữ config chung: `server.port`, `spring.application.name`, logging level gốc
- **`application-dev.yml`** — H2 in-memory, `ddl-auto=update`, `show-sql=true`, H2 console bật
- **`application-prod.yml`** — PostgreSQL: datasource `jdbc:postgresql://localhost:5432/resource_management`, `ddl-auto=validate`, `show-sql=false`
- **`application-docker.yml`** — giống prod nhưng host DB là tên service `db` thay vì `localhost`

### 3. Viết lại `docker-compose.yml`

Thêm 2 service mới vào compose hiện tại:

| Service | Image | Port | Tính năng |
|---------|-------|------|-----------|
| `db` | `postgres:16-alpine` | `5432` | Volume `pgdata` persist data, `POSTGRES_DB=resource_management`, health check |
| `pgadmin` | `dpage/pgadmin4:latest` | `5050` | Login bằng `admin@rm.com` / `admin`, auto-connect tới `db` |

Cập nhật service `be`:
- `SPRING_PROFILES_ACTIVE=docker` (giữ nguyên)
- `depends_on` thêm `db` và `pgadmin`
- Xoá `be-data` volume không cần thiết

### 4. Cập nhật `.gitignore`

Thêm dòng `be/volume/` (nếu chưa có) và `pgadmin-data/` ở root.

### 5. Cập nhật `README.md`

Thêm hướng dẫn:
- Chạy Docker Compose → gồm BE + FE + DB + pgAdmin
- URL pgAdmin: `http://localhost:5050`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Khi chạy local (`mvn spring-boot:run`) dùng profile `dev`

---

## Kết quả sau giai đoạn 1

```
docker-compose.yml     ← thêm db + pgadmin
be/
  pom.xml              ← thêm postgresql + springdoc
  Dockerfile           ← không đổi
  src/main/resources/
    application.yml    ← config chung
    application-dev.yml    ← H2 dev
    application-prod.yml   ← PostgreSQL prod
    application-docker.yml ← PostgreSQL docker
.gitignore             ← thêm pgadmin-data/
```

Chạy được `docker compose up` và thấy:
- API ở `http://localhost:8080`
- Swagger ở `http://localhost:8080/swagger-ui.html`
- pgAdmin ở `http://localhost:5050` → login → xem DB `resource_management`
