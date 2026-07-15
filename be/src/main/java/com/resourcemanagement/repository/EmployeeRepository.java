package com.resourcemanagement.repository;

import com.resourcemanagement.model.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByEmployeeCode(String employeeCode);

    Optional<Employee> findByEmployeeCode(String employeeCode);

    Page<Employee> findByDepartment(String department, Pageable pageable);

    Page<Employee> findByRole(String role, Pageable pageable);

    Page<Employee> findByDepartmentAndRole(String department, String role, Pageable pageable);

    List<Employee> findByRoleContainingIgnoreCase(String role);

    List<Employee> findByDepartmentContainingIgnoreCase(String department);

    List<Employee> findByRoleContainingIgnoreCaseAndDepartmentContainingIgnoreCase(String role, String department);

    // Tìm employee còn available >= minAvailable%
    @Query("SELECT e FROM Employee e WHERE e.employeeId IN (" +
           "  SELECT a.employee.employeeId FROM Allocation a " +
           "  GROUP BY a.employee.employeeId " +
           "  HAVING COALESCE(SUM(a.allocationPercent), 0) <= :maxAllocation" +
           ") OR e.employeeId NOT IN (SELECT a.employee.employeeId FROM Allocation a)")
    List<Employee> findAvailableEmployees(@Param("maxAllocation") Integer maxAllocation);

    // Tìm employee theo role + available filter
    @Query("SELECT e FROM Employee e WHERE " +
           "LOWER(e.role) LIKE LOWER(CONCAT('%', :role, '%')) " +
           "AND (e.employeeId IN (" +
           "  SELECT a.employee.employeeId FROM Allocation a " +
           "  GROUP BY a.employee.employeeId " +
           "  HAVING COALESCE(SUM(a.allocationPercent), 0) <= :maxAllocation" +
           ") OR e.employeeId NOT IN (SELECT a.employee.employeeId FROM Allocation a))")
    List<Employee> findByRoleContainingIgnoreCaseAndAvailable(
            @Param("role") String role,
            @Param("maxAllocation") Integer maxAllocation);
}
