package com.resourcemanagement.repository;

import com.resourcemanagement.model.entity.Allocation;
import com.resourcemanagement.model.entity.Employee;
import com.resourcemanagement.model.entity.Project;
import com.resourcemanagement.model.enums.ProjectStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class AllocationRepositoryTest {

    @Autowired
    private AllocationRepository allocationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private Employee employee;
    private Employee employee2;
    private Project project;
    private Project project2;

    @BeforeEach
    void setUp() {
        employee = employeeRepository.save(Employee.builder()
                .employeeCode("EMP001")
                .fullName("Alice")
                .email("alice@test.com")
                .role("Developer")
                .department("FSOFT")
                .build());

        employee2 = employeeRepository.save(Employee.builder()
                .employeeCode("EMP002")
                .fullName("Bob")
                .email("bob@test.com")
                .role("Tester")
                .department("FSOFT")
                .build());

        project = projectRepository.save(Project.builder()
                .projectCode("PRJ001")
                .projectName("Project A")
                .customer("Customer A")
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.of(2024, 1, 1))
                .endDate(LocalDate.of(2024, 12, 31))
                .build());

        project2 = projectRepository.save(Project.builder()
                .projectCode("PRJ002")
                .projectName("Project B")
                .customer("Customer B")
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.of(2024, 3, 1))
                .endDate(LocalDate.of(2024, 9, 30))
                .build());
    }

    @Test
    void getTotalAllocationByEmployee_ShouldReturnCorrectSum() {
        // Arrange
        allocationRepository.save(Allocation.builder()
                .employee(employee).project(project)
                .allocationPercent(50).roleInProject("Dev")
                .startDate(LocalDate.of(2024, 2, 1))
                .endDate(LocalDate.of(2024, 6, 30))
                .build());

        allocationRepository.save(Allocation.builder()
                .employee(employee).project(project2)
                .allocationPercent(30).roleInProject("Dev")
                .startDate(LocalDate.of(2024, 4, 1))
                .endDate(LocalDate.of(2024, 8, 31))
                .build());

        // Act
        Integer total = allocationRepository.getTotalAllocationByEmployee(employee.getEmployeeId());

        // Assert
        assertEquals(80, total);
    }

    @Test
    void getTotalAllocationByEmployee_NoAllocations_ShouldReturnZero() {
        // Act
        Integer total = allocationRepository.getTotalAllocationByEmployee(employee.getEmployeeId());

        // Assert
        assertEquals(0, total);
    }

    @Test
    void existsOverlappingAllocation_OverlapExists_ShouldReturnTrue() {
        // Arrange
        allocationRepository.save(Allocation.builder()
                .employee(employee).project(project)
                .allocationPercent(60).roleInProject("Dev")
                .startDate(LocalDate.of(2024, 2, 1))
                .endDate(LocalDate.of(2024, 6, 30))
                .build());

        // Act — same employee, same project, overlapping period
        boolean overlaps = allocationRepository.existsOverlappingAllocation(
                employee.getEmployeeId(),
                project.getProjectId(),
                LocalDate.of(2024, 5, 1),  // startDate inside existing range
                LocalDate.of(2024, 8, 31), // endDate extends beyond
                null                        // no exclude
        );

        // Assert
        assertTrue(overlaps);
    }

    @Test
    void existsOverlappingAllocation_NoOverlap_ShouldReturnFalse() {
        // Arrange
        allocationRepository.save(Allocation.builder()
                .employee(employee).project(project)
                .allocationPercent(60).roleInProject("Dev")
                .startDate(LocalDate.of(2024, 2, 1))
                .endDate(LocalDate.of(2024, 6, 30))
                .build());

        // Act — completely non-overlapping period
        boolean overlaps = allocationRepository.existsOverlappingAllocation(
                employee.getEmployeeId(),
                project.getProjectId(),
                LocalDate.of(2024, 7, 1),
                LocalDate.of(2024, 12, 31),
                null
        );

        // Assert
        assertFalse(overlaps);
    }

    @Test
    void existsOverlappingAllocation_ExcludeId_ShouldExcludeCorrectly() {
        // Arrange
        Allocation alloc = allocationRepository.save(Allocation.builder()
                .employee(employee).project(project)
                .allocationPercent(60).roleInProject("Dev")
                .startDate(LocalDate.of(2024, 2, 1))
                .endDate(LocalDate.of(2024, 6, 30))
                .build());

        // Act — same range, but exclude the saved allocation (like during update)
        boolean overlaps = allocationRepository.existsOverlappingAllocation(
                employee.getEmployeeId(),
                project.getProjectId(),
                LocalDate.of(2024, 2, 1),
                LocalDate.of(2024, 6, 30),
                alloc.getAllocationId()
        );

        // Assert
        assertFalse(overlaps);
    }

    @Test
    void findUtilizationReport_ShouldIncludeEmployeeWithNoAllocation() {
        // Arrange — only employee has allocation, employee2 has none
        allocationRepository.save(Allocation.builder()
                .employee(employee).project(project)
                .allocationPercent(50).roleInProject("Dev")
                .startDate(LocalDate.of(2024, 2, 1))
                .endDate(LocalDate.of(2024, 6, 30))
                .build());

        // Act
        List<Object[]> report = allocationRepository.findUtilizationReport();

        // Assert
        assertEquals(2, report.size()); // both employees should appear (LEFT JOIN)

        // Find employee2 (no allocation) — should have 0
        Object[] emp2Row = report.stream()
                .filter(r -> r[0].equals(employee2.getEmployeeId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Employee2 should be in report"));
        assertEquals("Bob", emp2Row[1]);
        assertEquals(0, ((Number) emp2Row[2]).intValue());
    }
}
