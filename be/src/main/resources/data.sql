-- Seed data cho môi trường dev — tự động load khi dùng spring.sql.init.mode=always
-- Dùng H2 cho test / PostgreSQL cho docker

INSERT INTO employee (employee_code, full_name, email, role, department, created_at, updated_at) VALUES
('EMP001', 'Tuan Ho Anh',    'tuanha@company.com',   'Senior Developer', 'FSOFT-Q1', NOW(), NOW()),
('EMP002', 'Le Thi Minh',     'minhlt@company.com',   'Developer',        'FSOFT-Q1', NOW(), NOW()),
('EMP003', 'Tran Van Nam',    'namtv@company.com',    'Junior Developer', 'FSOFT-Q2', NOW(), NOW()),
('EMP004', 'Pham Thi Lan',    'lanpt@company.com',    'Tester',           'FSOFT-Q1', NOW(), NOW());

INSERT INTO project (project_code, project_name, customer, status, start_date, end_date, created_at, updated_at) VALUES
('NCG-001',  'NCG Platform',     'NCG Corp',  'ACTIVE',   '2024-01-01', '2024-12-31', NOW(), NOW()),
('GRID-001', 'Grid System',      'Grid Inc',  'ACTIVE',   '2024-03-01', '2025-02-28', NOW(), NOW()),
('AI-001',   'Internal AI Tool', 'Internal',  'PLANNING', '2024-06-01', '2024-11-30', NOW(), NOW());

INSERT INTO allocation (employee_id, project_id, allocation_percent, role_in_project, start_date, end_date, version, created_at, updated_at) VALUES
(1, 1, 50, 'Backend Developer',   '2024-01-01', '2024-12-31', 0, NOW(), NOW()),
(1, 2, 30, 'Tech Lead',           '2024-03-01', '2024-12-31', 0, NOW(), NOW()),
(2, 1, 80, 'Fullstack Developer', '2024-01-01', '2024-12-31', 0, NOW(), NOW()),
(3, 2, 60, 'Frontend Developer',  '2024-03-01', '2024-12-31', 0, NOW(), NOW());
