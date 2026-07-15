# Phase 3 — Repository

> Mục tiêu: tạo các JPA repository interface với custom queries cho business logic và reports.

---

## Việc cần làm

### 1. `EmployeeRepository`

`be/src/main/java/com/resourcemanagement/repository/EmployeeRepository.java`

```java
package com.resourcemanagement.repository;

import com.resourcemanagement.model.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByEmployeeCode(String employeeCode);

    Optional<Employee> findByEmployeeCode(String employeeCode);

    Page<Employee> findByDepartment(String department, Pageable pageable);

    Page<Employee> findByRole(String role, Pageable pageable);

    Page<Employee> findByDepartmentAndRole(String department, String role, Pageable pageable);

    // Tìm employee còn available >= minAvailable%
    @Query("SELECT e FROM Employee e WHERE e.employeeId IN (" +
           "  SELECT a.employee.employeeId FROM Allocation a " +
           "  GROUP BY a.employee.employeeId " +
           "  HAVING COALESCE(SUM(a.allocationPercent), 0) <= :maxAllocation" +
           ") OR e.employeeId NOT IN (SELECT a.employee.employeeId FROM Allocation a)")
    List<Employee> findAvailableEmployees(@Param("maxAllocation") Integer maxAllocation);
}
```

### 2. `ProjectRepository`

`be/src/main/java/com/resourcemanagement/repository/ProjectRepository.java`

```java
package com.resourcemanagement.repository;

import com.resourcemanagement.model.entity.Project;
import com.resourcemanagement.model.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByProjectCode(String projectCode);

    Page<Project> findByStatus(ProjectStatus status, Pageable pageable);

    Page<Project> findByCustomerContainingIgnoreCase(String customer, Pageable pageable);

    List<Project> findByStatusNot(ProjectStatus status);
}
```

### 3. `AllocationRepository`

`be/src/main/java/com/resourcemanagement/repository/AllocationRepository.java`

```java
package com.resourcemanagement.repository;

import com.resourcemanagement.model.entity.Allocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {

    // SUM query ở DB level — không load records vào memory
    @Query("SELECT COALESCE(SUM(a.allocationPercent), 0) FROM Allocation a " +
           "WHERE a.employee.employeeId = :empId")
    Integer getTotalAllocationByEmployee(@Param("empId") Long empId);

    List<Allocation> findByEmployeeEmployeeId(Long employeeId);

    List<Allocation> findByProjectProjectId(Long projectId);

    // Overlap check: cùng employee, cùng project, trùng khoảng thời gian
    @Query("SELECT COUNT(a) > 0 FROM Allocation a " +
           "WHERE a.employee.employeeId = :empId " +
           "  AND a.project.projectId = :projectId " +
           "  AND a.startDate < :endDate " +
           "  AND a.endDate > :startDate " +
           "  AND (:excludeId IS NULL OR a.allocationId <> :excludeId)")
    boolean existsOverlappingAllocation(
            @Param("empId") Long empId,
            @Param("projectId") Long projectId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId);

    // Utilization report: LEFT JOIN để giữ employee chưa được allocate
    @Query("SELECT e.employeeId, e.fullName, COALESCE(SUM(a.allocationPercent), 0) " +
           "FROM Employee e LEFT JOIN Allocation a ON e.employeeId = a.employee.employeeId " +
           "GROUP BY e.employeeId, e.fullName " +
           "ORDER BY e.fullName ASC")
    List<Object[]> findUtilizationReport();

    // Available resources (SUM < 100)
    @Query("SELECT e.employeeId, e.fullName, COALESCE(SUM(a.allocationPercent), 0) " +
           "FROM Employee e LEFT JOIN Allocation a ON e.employeeId = a.employee.employeeId " +
           "GROUP BY e.employeeId, e.fullName " +
           "HAVING COALESCE(SUM(a.allocationPercent), 0) < 100 " +
           "ORDER BY e.fullName ASC")
    List<Object[]> findAvailableResources();

    // Overloaded resources (SUM > 90)
    @Query("SELECT e.employeeId, e.fullName, COALESCE(SUM(a.allocationPercent), 0) " +
           "FROM Employee e LEFT JOIN Allocation a ON e.employeeId = a.employee.employeeId " +
           "GROUP BY e.employeeId, e.fullName " +
           "HAVING COALESCE(SUM(a.allocationPercent), 0) > 90 " +
           "ORDER BY e.fullName ASC")
    List<Object[]> findOverloadedResources();
}
```

---

## Kết quả sau phase 3

- 3 repository interfaces
- `EmployeeRepository` — filter & pagination cơ bản, `findAvailableEmployees`
- `ProjectRepository` — filter theo status/customer
- `AllocationRepository` — SUM query, overlap check, 3 report queries
- Build thành công `mvn compile`
