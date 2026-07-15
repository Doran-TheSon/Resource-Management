package com.resourcemanagement.service;

import com.resourcemanagement.dto.request.AllocationRequest;
import com.resourcemanagement.dto.response.AllocationDetailDTO;
import com.resourcemanagement.dto.response.AllocationResponse;
import com.resourcemanagement.dto.response.EmployeeUtilizationDTO;
import com.resourcemanagement.dto.response.WorkloadResponse;
import com.resourcemanagement.exception.AllocationExceededException;
import com.resourcemanagement.exception.AllocationNotFoundException;
import com.resourcemanagement.exception.AllocationOverlapException;
import com.resourcemanagement.exception.EmployeeNotFoundException;
import com.resourcemanagement.exception.InvalidDateRangeException;
import com.resourcemanagement.exception.OptimisticLockException;
import com.resourcemanagement.exception.ProjectCompletedException;
import com.resourcemanagement.exception.ProjectNotFoundException;
import com.resourcemanagement.model.entity.Allocation;
import com.resourcemanagement.model.entity.Employee;
import com.resourcemanagement.model.entity.Project;
import com.resourcemanagement.model.enums.ProjectStatus;
import com.resourcemanagement.repository.AllocationRepository;
import com.resourcemanagement.repository.EmployeeRepository;
import com.resourcemanagement.repository.ProjectRepository;
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
    private static final int MAX_ALLOCATION = 100;
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
            throw new ProjectCompletedException(project.getProjectName());
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
        if (newTotal > MAX_ALLOCATION) {
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
        } catch (jakarta.persistence.OptimisticLockException e) {
            throw new OptimisticLockException();
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
            throw new ProjectCompletedException(project.getProjectName());
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
        if (newTotal > MAX_ALLOCATION) {
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
        } catch (jakarta.persistence.OptimisticLockException e) {
            throw new OptimisticLockException();
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
            MAX_ALLOCATION - totalAllocation,
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
