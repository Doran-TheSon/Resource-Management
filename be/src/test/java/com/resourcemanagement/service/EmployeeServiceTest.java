package com.resourcemanagement.service;

import com.resourcemanagement.dto.request.EmployeeRequest;
import com.resourcemanagement.dto.response.EmployeeResponse;
import com.resourcemanagement.exception.EmployeeCodeExistedException;
import com.resourcemanagement.exception.EmployeeNotFoundException;
import com.resourcemanagement.model.entity.Employee;
import com.resourcemanagement.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee employee;
    private EmployeeRequest validRequest;

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

        validRequest = new EmployeeRequest(
                "EMP001",
                "Test Employee",
                "test@company.com",
                "Developer",
                "FSOFT"
        );
    }

    @Test
    void create_ValidRequest_ShouldSucceed() {
        // Arrange
        when(employeeRepository.existsByEmployeeCode("EMP001")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);

        // Act
        EmployeeResponse response = employeeService.create(validRequest);

        // Assert
        assertNotNull(response);
        assertEquals("EMP001", response.employeeCode());
        assertEquals("Test Employee", response.fullName());
        verify(employeeRepository).save(any(Employee.class));
    }

    @Test
    void create_DuplicateCode_ShouldThrowEmployeeCodeExistedException() {
        // Arrange
        when(employeeRepository.existsByEmployeeCode("EMP001")).thenReturn(true);

        // Act & Assert
        assertThrows(EmployeeCodeExistedException.class, () -> employeeService.create(validRequest));
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void findById_NonExisting_ShouldThrowEmployeeNotFoundException() {
        // Arrange
        when(employeeRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EmployeeNotFoundException.class, () -> employeeService.findById(99L));
    }

    @Test
    void update_ExistingEmployee_ShouldSucceed() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);

        EmployeeRequest updateRequest = new EmployeeRequest(
                "EMP001", "Updated Name", "updated@company.com", "Senior", "FSOFT-Q2");

        // Act
        EmployeeResponse response = employeeService.update(1L, updateRequest);

        // Assert
        assertNotNull(response);
        verify(employeeRepository).save(any(Employee.class));
    }
}
