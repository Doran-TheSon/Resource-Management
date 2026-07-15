package com.resourcemanagement.ai;

import com.resourcemanagement.dto.response.AiRecommendationResponse.RecommendedResource;
import com.resourcemanagement.model.entity.Employee;
import com.resourcemanagement.repository.AllocationRepository;
import com.resourcemanagement.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Tools / function-calling methods cho Gemini AI.
 * Mỗi @Tool method là một "hành động" AI có thể gọi để query DB.
 * Không cần Spring AI annotation ở đây — dùng @Component + manual register.
 */
@Component
@RequiredArgsConstructor
public class ResourceTools {

    private static final Logger log = LoggerFactory.getLogger(ResourceTools.class);
    private static final int MAX_ALLOCATION = 100;

    private final EmployeeRepository employeeRepository;
    private final AllocationRepository allocationRepository;

    /**
     * Tìm nhân viên theo role, department, và available tối thiểu.
     * Nếu role là multi-word (vd "Java Developer") không match exact -> fallback match từng keyword riêng lẻ.
     */
    public List<RecommendedResource> findEmployees(String role, String department, Integer minAvailable) {
        log.info("Tool: findEmployees(role={}, department={}, minAvailable={})", role, department, minAvailable);

        int maxAllocation = (minAvailable != null) ? (MAX_ALLOCATION - minAvailable) : MAX_ALLOCATION;
        List<Employee> employees;

        if (role != null && !role.isBlank() && department != null && !department.isBlank()) {
            employees = employeeRepository.findByRoleContainingIgnoreCaseAndDepartmentContainingIgnoreCase(role, department)
                    .stream()
                    .filter(e -> getAllocationTotal(e.getEmployeeId()) <= maxAllocation)
                    .toList();
            if (employees.isEmpty()) {
                employees = findByRoleFallback(role, department, maxAllocation);
            }
        } else if (role != null && !role.isBlank()) {
            employees = employeeRepository.findByRoleContainingIgnoreCaseAndAvailable(role, maxAllocation);
            if (employees.isEmpty()) {
                employees = findByRoleFallback(role, null, maxAllocation);
            }
        } else if (department != null && !department.isBlank()) {
            employees = employeeRepository.findByDepartmentContainingIgnoreCase(department)
                    .stream()
                    .filter(e -> getAllocationTotal(e.getEmployeeId()) <= maxAllocation)
                    .toList();
        } else {
            employees = employeeRepository.findAvailableEmployees(maxAllocation);
        }

        return employees.stream()
                .map(this::toRecommendedResource)
                .toList();
    }

    /**
     * Fallback: tách role multi-word thành từng keyword riêng lẻ, thử match từng cái.
     * Ví dụ: "Java Developer" -> match "Developer" hoặc "Senior Developer"
     */
    private List<Employee> findByRoleFallback(String role, String department, int maxAllocation) {
        String[] words = role.toLowerCase().split("[\\s,]+");
        for (String word : words) {
            if (word.length() < 3) continue; // bỏ từ quá ngắn (vd "in", "the", "java" vẫn ok vì >=3)
            List<Employee> matches;
            if (department != null && !department.isBlank()) {
                matches = employeeRepository.findByRoleContainingIgnoreCaseAndDepartmentContainingIgnoreCase(word, department);
            } else {
                matches = employeeRepository.findByRoleContainingIgnoreCase(word);
            }
            List<Employee> filtered = matches.stream()
                    .filter(e -> getAllocationTotal(e.getEmployeeId()) <= maxAllocation)
                    .toList();
            if (!filtered.isEmpty()) {
                return filtered;
            }
        }
        return List.of();
    }

    /**
     * Lấy utilization report (tất cả employee + tổng allocation).
     */
    public List<EmployeeUtilization> getUtilizationReport() {
        log.info("Tool: getUtilizationReport()");
        return allocationRepository.findUtilizationReport()
                .stream()
                .map(row -> new EmployeeUtilization(
                        (Long) row[0],
                        (String) row[1],
                        ((Number) row[2]).intValue()))
                .toList();
    }

    /**
     * Lấy danh sách employee bị overloaded (> 90%).
     */
    public List<EmployeeUtilization> getOverloadedResources() {
        log.info("Tool: getOverloadedResources()");
        return allocationRepository.findOverloadedResources()
                .stream()
                .map(row -> new EmployeeUtilization(
                        (Long) row[0],
                        (String) row[1],
                        ((Number) row[2]).intValue()))
                .toList();
    }

    /**
     * Lấy danh sách employee còn available (< 100%).
     */
    public List<EmployeeUtilization> getAvailableResources() {
        log.info("Tool: getAvailableResources()");
        return allocationRepository.findAvailableResources()
                .stream()
                .map(row -> new EmployeeUtilization(
                        (Long) row[0],
                        (String) row[1],
                        ((Number) row[2]).intValue()))
                .toList();
    }

    /**
     * Lấy tổng allocation của 1 employee.
     */
    public int getEmployeeTotalAllocation(Long employeeId) {
        return getAllocationTotal(employeeId);
    }

    /**
     * Lấy dự án hiện tại của 1 employee.
     */
    public List<String> getEmployeeProjects(Long employeeId) {
        return allocationRepository.findProjectNamesByEmployeeId(employeeId);
    }

    /**
     * Thống kê số lượng employee theo role.
     */
    public List<RoleCount> countEmployeesByRole() {
        return allocationRepository.countEmployeesByRole()
                .stream()
                .map(row -> new RoleCount((String) row[0], (Long) row[1]))
                .toList();
    }

    // --- helpers ---

    private int getAllocationTotal(Long employeeId) {
        Integer total = allocationRepository.getTotalAllocationByEmployee(employeeId);
        return total != null ? total : 0;
    }

    private RecommendedResource toRecommendedResource(Employee e) {
        int totalAlloc = getAllocationTotal(e.getEmployeeId());
        List<String> projects = allocationRepository.findProjectNamesByEmployeeId(e.getEmployeeId());
        return new RecommendedResource(
                e.getEmployeeId(),
                e.getFullName(),
                e.getRole(),
                e.getDepartment(),
                e.getEmail(),
                MAX_ALLOCATION - totalAlloc,
                projects
        );
    }

    // --- inner records for tool return types ---

    public record EmployeeUtilization(Long employeeId, String fullName, int totalAllocation) {
        public int getAvailable() { return MAX_ALLOCATION - totalAllocation; }
    }

    public record RoleCount(String role, Long count) {}
}
