package com.resourcemanagement.service;

import com.resourcemanagement.dto.request.AllocationRequest;
import com.resourcemanagement.dto.response.AllocationResponse;
import com.resourcemanagement.exception.*;
import com.resourcemanagement.model.entity.Allocation;
import com.resourcemanagement.model.entity.Employee;
import com.resourcemanagement.model.entity.Project;
import com.resourcemanagement.model.enums.ProjectStatus;
import com.resourcemanagement.repository.AllocationRepository;
import com.resourcemanagement.repository.EmployeeRepository;
import com.resourcemanagement.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AllocationServiceTest {

    @Mock
    private AllocationRepository allocationRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private AllocationService allocationService;

    private Employee employee;
    private Project activeProject;
    private Project completedProject;
    private AllocationRequest validRequest;
    private Allocation savedAllocation;

    private static final LocalDate PROJECT_START = LocalDate.of(2024, 1, 1);
    private static final LocalDate PROJECT_END = LocalDate.of(2024, 12, 31);
    private static final LocalDate ALLOC_START = LocalDate.of(2024, 2, 1);
    private static final LocalDate ALLOC_END = LocalDate.of(2024, 6, 30);

    @BeforeEach
    void setUp() {
        employee = Employee.builder()
                .employeeId(1L)
                .employeeCode("EMP001")
                .fullName("Test Employee")
                .email("test@company.com")
                .role("Developer")
                .department("FSOFT")
                .build();

        activeProject = Project.builder()
                .projectId(1L)
                .projectCode("PRJ001")
                .projectName("Active Project")
                .customer("Customer A")
                .status(ProjectStatus.ACTIVE)
                .startDate(PROJECT_START)
                .endDate(PROJECT_END)
                .build();

        completedProject = Project.builder()
                .projectId(2L)
                .projectCode("PRJ002")
                .projectName("Completed Project")
                .customer("Customer B")
                .status(ProjectStatus.COMPLETED)
                .startDate(PROJECT_START)
                .endDate(PROJECT_END)
                .build();

        validRequest = new AllocationRequest(
                1L,                    // employeeId
                1L,                    // projectId
                50,                    // allocationPercent
                "Backend Developer",   // roleInProject
                ALLOC_START,           // startDate
                ALLOC_END              // endDate
        );

        savedAllocation = Allocation.builder()
                .allocationId(1L)
                .employee(employee)
                .project(activeProject)
                .allocationPercent(50)
                .roleInProject("Backend Developer")
                .startDate(ALLOC_START)
                .endDate(ALLOC_END)
                .version(0L)
                .build();
    }

    @Test
    void create_ValidRequest_ShouldSucceed() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));
        when(allocationRepository.existsOverlappingAllocation(anyLong(), anyLong(), any(), any(), isNull()))
                .thenReturn(false);
        when(allocationRepository.getTotalAllocationByEmployee(1L)).thenReturn(30); // current = 30%
        when(allocationRepository.save(any(Allocation.class))).thenReturn(savedAllocation);

        // Act
        AllocationResponse response = allocationService.create(validRequest);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.allocationId());
        assertEquals(50, response.allocationPercent());
        assertEquals("Backend Developer", response.roleInProject());
        verify(allocationRepository).save(any(Allocation.class));
    }

    @Test
    void create_TotalExceeds100_ShouldThrowAllocationExceededException() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));
        when(allocationRepository.existsOverlappingAllocation(anyLong(), anyLong(), any(), any(), isNull()))
                .thenReturn(false);
        when(allocationRepository.getTotalAllocationByEmployee(1L)).thenReturn(60); // current = 60%, new = 50 → 110%

        // Act & Assert
        assertThrows(AllocationExceededException.class, () -> allocationService.create(validRequest));
        verify(allocationRepository, never()).save(any(Allocation.class));
    }

    @Test
    void create_CompletedProject_ShouldThrowProjectCompletedException() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(2L)).thenReturn(Optional.of(completedProject));
        AllocationRequest request = new AllocationRequest(
                1L, 2L, 50, "Dev", ALLOC_START, ALLOC_END);

        // Act & Assert
        assertThrows(ProjectCompletedException.class, () -> allocationService.create(request));
        verify(allocationRepository, never()).save(any(Allocation.class));
    }

    @Test
    void create_StartDateBeforeProjectStart_ShouldThrowInvalidDateRangeException() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));
        AllocationRequest request = new AllocationRequest(
                1L, 1L, 50, "Dev",
                PROJECT_START.minusDays(5), // startDate < project.startDate
                ALLOC_END);

        // Act & Assert
        assertThrows(InvalidDateRangeException.class, () -> allocationService.create(request));
        verify(allocationRepository, never()).save(any(Allocation.class));
    }

    @Test
    void create_EndDateBeforeStartDate_ShouldThrowInvalidDateRangeException() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));
        AllocationRequest request = new AllocationRequest(
                1L, 1L, 50, "Dev",
                ALLOC_START, ALLOC_START.minusDays(1)); // endDate < startDate

        // Act & Assert
        assertThrows(InvalidDateRangeException.class, () -> allocationService.create(request));
        verify(allocationRepository, never()).save(any(Allocation.class));
    }

    @Test
    void create_OverlappingAllocation_ShouldThrowAllocationOverlapException() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));
        when(allocationRepository.existsOverlappingAllocation(
                anyLong(), anyLong(), any(), any(), isNull()))
                .thenReturn(true); // overlap detected

        // Act & Assert
        assertThrows(AllocationOverlapException.class, () -> allocationService.create(validRequest));
        verify(allocationRepository, never()).save(any(Allocation.class));
    }

    @Test
    void create_EmployeeNotFound_ShouldThrowEmployeeNotFoundException() {
        // Arrange
        when(employeeRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EmployeeNotFoundException.class, () -> allocationService.create(validRequest));
        verify(allocationRepository, never()).save(any(Allocation.class));
    }

    @Test
    void create_ProjectNotFound_ShouldThrowProjectNotFoundException() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ProjectNotFoundException.class, () -> allocationService.create(validRequest));
        verify(allocationRepository, never()).save(any(Allocation.class));
    }

    @Test
    void update_NewTotalExceeds100_ShouldThrowAllocationExceededException() {
        // Arrange
        when(allocationRepository.findById(1L)).thenReturn(Optional.of(savedAllocation));
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));
        when(allocationRepository.existsOverlappingAllocation(anyLong(), anyLong(), any(), any(), anyLong()))
                .thenReturn(false);
        // current total = 60%, existing allocation = 50%, new allocation = 80%
        // new total = 60 - 50 + 80 = 90 — still ok
        // Let's make it exceed: new total = 60 - 50 + 100 = 110
        when(allocationRepository.getTotalAllocationByEmployee(1L)).thenReturn(60);

        AllocationRequest updateRequest = new AllocationRequest(
                1L, 1L, 100, "Updated Role", ALLOC_START, ALLOC_END);

        // Act & Assert
        assertThrows(AllocationExceededException.class, () -> allocationService.update(1L, updateRequest));
        verify(allocationRepository, never()).save(any(Allocation.class));
    }

    @Test
    void create_AllocationPercentMin_ShouldSucceed() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));
        when(allocationRepository.existsOverlappingAllocation(anyLong(), anyLong(), any(), any(), isNull()))
                .thenReturn(false);
        when(allocationRepository.getTotalAllocationByEmployee(1L)).thenReturn(0);

        AllocationRequest minRequest = new AllocationRequest(
                1L, 1L, 1, "Dev", ALLOC_START, ALLOC_END);

        Allocation minAllocation = Allocation.builder()
                .allocationId(2L)
                .employee(employee)
                .project(activeProject)
                .allocationPercent(1)
                .roleInProject("Dev")
                .startDate(ALLOC_START)
                .endDate(ALLOC_END)
                .version(0L)
                .build();

        when(allocationRepository.save(any(Allocation.class))).thenReturn(minAllocation);

        // Act
        AllocationResponse response = allocationService.create(minRequest);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.allocationPercent());
        verify(allocationRepository).save(any(Allocation.class));
    }

    @Test
    void create_AllocationPercentMax_ShouldSucceed() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));
        when(allocationRepository.existsOverlappingAllocation(anyLong(), anyLong(), any(), any(), isNull()))
                .thenReturn(false);
        when(allocationRepository.getTotalAllocationByEmployee(1L)).thenReturn(0);

        AllocationRequest maxRequest = new AllocationRequest(
                1L, 1L, 100, "Full Time", ALLOC_START, ALLOC_END);

        Allocation maxAllocation = Allocation.builder()
                .allocationId(3L)
                .employee(employee)
                .project(activeProject)
                .allocationPercent(100)
                .roleInProject("Full Time")
                .startDate(ALLOC_START)
                .endDate(ALLOC_END)
                .version(0L)
                .build();

        when(allocationRepository.save(any(Allocation.class))).thenReturn(maxAllocation);

        // Act
        AllocationResponse response = allocationService.create(maxRequest);

        // Assert
        assertNotNull(response);
        assertEquals(100, response.allocationPercent());
        verify(allocationRepository).save(any(Allocation.class));
    }

    @Test
    void delete_ExistingAllocation_ShouldSucceed() {
        // Arrange
        when(allocationRepository.existsById(1L)).thenReturn(true);
        doNothing().when(allocationRepository).deleteById(1L);

        // Act & Assert
        assertDoesNotThrow(() -> allocationService.delete(1L));
        verify(allocationRepository).deleteById(1L);
    }

    @Test
    void delete_NonExistingAllocation_ShouldThrowAllocationNotFoundException() {
        // Arrange
        when(allocationRepository.existsById(anyLong())).thenReturn(false);

        // Act & Assert
        assertThrows(AllocationNotFoundException.class, () -> allocationService.delete(99L));
        verify(allocationRepository, never()).deleteById(anyLong());
    }

    @Test
    void update_ValidUpdate_ShouldSucceed() {
        // Arrange
        when(allocationRepository.findById(1L)).thenReturn(Optional.of(savedAllocation));
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(activeProject));
        when(allocationRepository.existsOverlappingAllocation(anyLong(), anyLong(), any(), any(), anyLong()))
                .thenReturn(false);
        when(allocationRepository.getTotalAllocationByEmployee(1L)).thenReturn(60); // total = 60%
        // new total = 60 - 50 + 60 = 70% (ok)
        when(allocationRepository.save(any(Allocation.class))).thenReturn(savedAllocation);

        AllocationRequest updateRequest = new AllocationRequest(
                1L, 1L, 60, "Senior Dev", ALLOC_START, ALLOC_END);

        // Act
        AllocationResponse response = allocationService.update(1L, updateRequest);

        // Assert
        assertNotNull(response);
        verify(allocationRepository).save(any(Allocation.class));
    }
}
