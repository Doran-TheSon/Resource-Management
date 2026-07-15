# Phase 6 — Service Layer

> Mục tiêu: implement business logic — đây là layer quan trọng nhất, chứa toàn bộ validation.

---

## Việc cần làm

### 1. `EmployeeService`

`be/src/main/java/com/resourcemanagement/service/EmployeeService.java`

```java
package com.resourcemanagement.service;

import com.resourcemanagement.dto.request.EmployeeRequest;
import com.resourcemanagement.dto.response.EmployeeResponse;
import com.resourcemanagement.exception.EmployeeCodeExistedException;
import com.resourcemanagement.exception.EmployeeNotFoundException;
import com.resourcemanagement.model.entity.Employee;
import com.resourcemanagement.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);
    private final EmployeeRepository employeeRepository;

    public List<EmployeeResponse> findAll(int page, int size, String department, String role) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("fullName").ascending());
        Page<Employee> employees;

        if (department != null && role != null) {
            employees = employeeRepository.findByDepartmentAndRole(department, role, pageRequest);
        } else if (department != null) {
            employees = employeeRepository.findByDepartment(department, pageRequest);
        } else if (role != null) {
            employees = employeeRepository.findByRole(role, pageRequest);
        } else {
            employees = employeeRepository.findAll(pageRequest);
        }

        return employees.stream().map(this::toResponse).toList();
    }

    public EmployeeResponse findById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
        return toResponse(employee);
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        if (employeeRepository.existsByEmployeeCode(request.employeeCode())) {
            throw new EmployeeCodeExistedException(request.employeeCode());
        }

        Employee employee = Employee.builder()
                .employeeCode(request.employeeCode())
                .fullName(request.fullName())
                .email(request.email())
                .role(request.role())
                .department(request.department())
                .build();

        employee = employeeRepository.save(employee);
        log.info("Created employee: code={}, name={}", employee.getEmployeeCode(), employee.getFullName());
        return toResponse(employee);
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));

        // Nếu đổi employeeCode, check không trùng
        if (!employee.getEmployeeCode().equals(request.employeeCode())
                && employeeRepository.existsByEmployeeCode(request.employeeCode())) {
            throw new EmployeeCodeExistedException(request.employeeCode());
        }

        employee.setEmployeeCode(request.employeeCode());
        employee.setFullName(request.fullName());
        employee.setEmail(request.email());
        employee.setRole(request.role());
        employee.setDepartment(request.department());

        employee = employeeRepository.save(employee);
        log.info("Updated employee: id={}, code={}", id, employee.getEmployeeCode());
        return toResponse(employee);
    }

    @Transactional
    public void delete(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new EmployeeNotFoundException(id);
        }
        employeeRepository.deleteById(id);
        log.info("Deleted employee: id={}", id);
    }

    private EmployeeResponse toResponse(Employee e) {
        return new EmployeeResponse(
            e.getEmployeeId(), e.getEmployeeCode(), e.getFullName(),
            e.getEmail(), e.getRole(), e.getDepartment(),
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}
```

### 2. `ProjectService`

```java
package com.resourcemanagement.service;

import com.resourcemanagement.dto.request.ProjectRequest;
import com.resourcemanagement.dto.response.ProjectResponse;
import com.resourcemanagement.exception.InvalidDateRangeException;
import com.resourcemanagement.exception.ProjectCodeExistedException;
import com.resourcemanagement.exception.ProjectNotFoundException;
import com.resourcemanagement.model.entity.Project;
import com.resourcemanagement.model.enums.ProjectStatus;
import com.resourcemanagement.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);
    private final ProjectRepository projectRepository;

    public List<ProjectResponse> findAll(int page, int size, String status, String customer) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("startDate").descending());
        Page<Project> projects;

        if (status != null && customer != null) {
            projects = projectRepository.findByStatusAndCustomerContainingIgnoreCase(
                    ProjectStatus.valueOf(status.toUpperCase()), customer, pageRequest);
        } else if (status != null) {
            projects = projectRepository.findByStatus(ProjectStatus.valueOf(status.toUpperCase()), pageRequest);
        } else if (customer != null) {
            projects = projectRepository.findByCustomerContainingIgnoreCase(customer, pageRequest);
        } else {
            projects = projectRepository.findAll(pageRequest);
        }

        return projects.stream().map(this::toResponse).toList();
    }

    public ProjectResponse findById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(id));
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request) {
        if (projectRepository.existsByProjectCode(request.projectCode())) {
            throw new ProjectCodeExistedException(request.projectCode());
        }

        validateDateRange(request.startDate(), request.endDate());

        Project project = Project.builder()
                .projectCode(request.projectCode())
                .projectName(request.projectName())
                .customer(request.customer())
                .status(ProjectStatus.valueOf(request.status()))
                .startDate(request.startDate())
                .endDate(request.endDate())
                .build();

        project = projectRepository.save(project);
        log.info("Created project: code={}, name={}", project.getProjectCode(), project.getProjectName());
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(id));

        if (!project.getProjectCode().equals(request.projectCode())
                && projectRepository.existsByProjectCode(request.projectCode())) {
            throw new ProjectCodeExistedException(request.projectCode());
        }

        validateDateRange(request.startDate(), request.endDate());

        project.setProjectCode(request.projectCode());
        project.setProjectName(request.projectName());
        project.setCustomer(request.customer());
        project.setStatus(ProjectStatus.valueOf(request.status()));
        project.setStartDate(request.startDate());
        project.setEndDate(request.endDate());

        project = projectRepository.save(project);
        log.info("Updated project: id={}, code={}", id, project.getProjectCode());
        return toResponse(project);
    }

    private void validateDateRange(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new InvalidDateRangeException("End date must be after or equal to start date");
        }
    }

    private ProjectResponse toResponse(Project p) {
        return new ProjectResponse(
            p.getProjectId(), p.getProjectCode(), p.getProjectName(),
            p.getCustomer(), p.getStatus(), p.getStartDate(), p.getEndDate(),
            p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
```

> **Note:** cần thêm method `findByStatusAndCustomerContainingIgnoreCase` vào `ProjectRepository`.

### 3. `AllocationService`

```java
package com.resourcemanagement.service;

import com.resourcemanagement.dto.request.AllocationRequest;
import com.resourcemanagement.dto.response.*;
import com.resourcemanagement.exception.*;
import com.resourcemanagement.model.entity.Allocation;
import com.resourcemanagement.model.entity.Employee;
import com.resourcemanagement.model.entity.Project;
import com.resourcemanagement.model.enums.ProjectStatus;
import com.resourcemanagement.repository.AllocationRepository;
import com.resourcemanagement.repository.EmployeeRepository;
import com.resourcemanagement.repository.ProjectRepository;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AllocationService {

    private static final Logger log = LoggerFactory.getLogger(AllocationService.class);
    private final AllocationRepository allocationRepository;
    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;

    @Transactional
    public AllocationResponse create(AllocationRequest request) {
        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new EmployeeNotFoundException(request.employeeId()));
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ProjectNotFoundException(request.projectId()));

        // Không allocate vào COMPLETED project
        if (project.getStatus() == ProjectStatus.COMPLETED) {
            throw new ProjectCompletedException("Cannot allocate to COMPLETED project");
        }

        // Date range: startDate >= project.startDate
        if (request.startDate().isBefore(project.getStartDate())) {
            throw new InvalidDateRangeException(
                "Allocation start date must be after or equal to project start date (" + project.getStartDate() + ")");
        }

        // Date range: endDate >= startDate
        if (request.endDate().isBefore(request.startDate())) {
            throw new InvalidDateRangeException("End date must be after or equal to start date");
        }

        // Overlap check
        if (allocationRepository.existsOverlappingAllocation(
                request.employeeId(), request.projectId(),
                request.startDate(), request.endDate(), null)) {
            throw new AllocationOverlapException(
                "Employee already has an allocation on this project during the requested time period");
        }

        // Tổng ≤ 100% — SUM query ở DB level
        Integer currentTotal = allocationRepository.getTotalAllocationByEmployee(request.employeeId());
        int newTotal = currentTotal + request.allocationPercent();
        if (newTotal > 100) {
            log.warn("Allocation exceeded 100% for employee={}: current={}, new={}",
                request.employeeId(), currentTotal, request.allocationPercent());
            throw new AllocationExceededException(
                "Employee allocation exceeds 100% (current: " + currentTotal + "%, trying to add: " + request.allocationPercent() + "%)");
        }

        Allocation allocation = Allocation.builder()
                .employee(employee)
                .project(project)
                .allocationPercent(request.allocationPercent())
                .roleInProject(request.roleInProject())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .build();

        try {
            allocation = allocationRepository.save(allocation);
        } catch (OptimisticLockException e) {
            throw new com.resourcemanagement.exception.OptimisticLockException();
        }

        log.info("Created allocation: employee={}, project={}, percent={}%",
            request.employeeId(), request.projectId(), request.allocationPercent());
        return toResponse(allocation);
    }

    @Transactional
    public AllocationResponse update(Long id, AllocationRequest request) {
        Allocation allocation = allocationRepository.findById(id)
                .orElseThrow(() -> new AllocationNotFoundException(id));

        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new EmployeeNotFoundException(request.employeeId()));
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ProjectNotFoundException(request.projectId()));

        if (project.getStatus() == ProjectStatus.COMPLETED) {
            throw new ProjectCompletedException("Cannot allocate to COMPLETED project");
        }

        if (request.startDate().isBefore(project.getStartDate())) {
            throw new InvalidDateRangeException(
                "Allocation start date must be after or equal to project start date (" + project.getStartDate() + ")");
        }

        if (request.endDate().isBefore(request.startDate())) {
            throw new InvalidDateRangeException("End date must be after or equal to start date");
        }

        // Overlap check — loại trừ chính allocation đang update
        if (allocationRepository.existsOverlappingAllocation(
                request.employeeId(), request.projectId(),
                request.startDate(), request.endDate(), id)) {
            throw new AllocationOverlapException(
                "Employee already has an allocation on this project during the requested time period");
        }

        // Tính tổng: trừ allocation cũ, + allocation mới
        Integer currentTotal = allocationRepository.getTotalAllocationByEmployee(request.employeeId());
        int newTotal = currentTotal - allocation.getAllocationPercent() + request.allocationPercent();
        if (newTotal > 100) {
            throw new AllocationExceededException(
                "Employee allocation would exceed 100% (would be: " + newTotal + "%)");
        }

        allocation.setEmployee(employee);
        allocation.setProject(project);
        allocation.setAllocationPercent(request.allocationPercent());
        allocation.setRoleInProject(request.roleInProject());
        allocation.setStartDate(request.startDate());
        allocation.setEndDate(request.endDate());

        try {
            allocation = allocationRepository.save(allocation);
        } catch (OptimisticLockException e) {
            throw new com.resourcemanagement.exception.OptimisticLockException();
        }

        log.info("Updated allocation: id={}, employee={}, project={}, percent={}%",
            id, request.employeeId(), request.projectId(), request.allocationPercent());
        return toResponse(allocation);
    }

    @Transactional
    public void delete(Long id) {
        if (!allocationRepository.existsById(id)) {
            throw new AllocationNotFoundException(id);
        }
        allocationRepository.deleteById(id);
        log.info("Deleted allocation: id={}", id);
    }

    public WorkloadResponse getWorkload(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EmployeeNotFoundException(employeeId));

        List<Allocation> allocations = allocationRepository.findByEmployeeEmployeeId(employeeId);
        int totalAllocation = allocations.stream()
                .mapToInt(Allocation::getAllocationPercent)
                .sum();

        List<AllocationDetailDTO> details = allocations.stream()
                .map(a -> new AllocationDetailDTO(
                    a.getAllocationId(),
                    a.getProject().getProjectName(),
                    a.getProject().getProjectCode(),
                    a.getAllocationPercent(),
                    a.getRoleInProject(),
                    a.getStartDate(),
                    a.getEndDate()))
                .toList();

        return new WorkloadResponse(
            employeeId,
            employee.getFullName(),
            totalAllocation,
            100 - totalAllocation,
            details
        );
    }

    // Report methods
    public List<EmployeeUtilizationDTO> getUtilizationReport() {
        return allocationRepository.findUtilizationReport()
                .stream()
                .map(row -> new EmployeeUtilizationDTO(
                    (Long) row[0],
                    (String) row[1],
                    ((Number) row[2]).intValue()))
                .toList();
    }

    public List<EmployeeUtilizationDTO> getAvailableResources() {
        return allocationRepository.findAvailableResources()
                .stream()
                .map(row -> new EmployeeUtilizationDTO(
                    (Long) row[0],
                    (String) row[1],
                    ((Number) row[2]).intValue()))
                .toList();
    }

    public List<EmployeeUtilizationDTO> getOverloadedResources() {
        return allocationRepository.findOverloadedResources()
                .stream()
                .map(row -> new EmployeeUtilizationDTO(
                    (Long) row[0],
                    (String) row[1],
                    ((Number) row[2]).intValue()))
                .toList();
    }

    private AllocationResponse toResponse(Allocation a) {
        return new AllocationResponse(
            a.getAllocationId(),
            a.getEmployee().getEmployeeId(),
            a.getEmployee().getFullName(),
            a.getProject().getProjectId(),
            a.getProject().getProjectName(),
            a.getProject().getProjectCode(),
            a.getAllocationPercent(),
            a.getRoleInProject(),
            a.getStartDate(),
            a.getEndDate(),
            a.getCreatedAt(),
            a.getUpdatedAt()
        );
    }
}
```

---

## Kết quả sau phase 6

- `EmployeeService` — CRUD + check duplicate employeeCode
- `ProjectService` — CRUD + validate date range + check duplicate projectCode
- `AllocationService` — full business rules:
  - Range validation 1-100%
  - Tổng ≤ 100% (SUM query + Optimistic Lock)
  - Không allocate vào COMPLETED project
  - Date range validation (startDate >= project.startDate, endDate >= startDate)
  - Overlap check (cùng employee, cùng project, trùng thời gian)
  - Update: trừ allocation cũ, + allocation mới
  - 3 report methods (utilization, available, overloaded)
- Logging đầy đủ (INFO cho CRUD, WARN cho validation fail)
- Build thành công `mvn compile`
