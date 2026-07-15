package com.resourcemanagement.repository;

import com.resourcemanagement.model.entity.Allocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

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

    // Lấy danh sách allocation hiện tại của employee (cùng tên project)
    @Query("SELECT a.project.projectName FROM Allocation a WHERE a.employee.employeeId = :empId")
    List<String> findProjectNamesByEmployeeId(@Param("empId") Long empId);

    // Đếm tổng employee đang được allocate
    @Query("SELECT COUNT(DISTINCT a.employee.employeeId) FROM Allocation a")
    Long countDistinctAllocatedEmployees();

    // Employee stats: đếm số lượng employee theo role
    @Query("SELECT e.role, COUNT(e) FROM Employee e GROUP BY e.role")
    List<Object[]> countEmployeesByRole();
}
