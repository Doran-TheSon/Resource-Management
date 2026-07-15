package com.resourcemanagement.service;

import com.resourcemanagement.dto.request.ProjectRequest;
import com.resourcemanagement.dto.response.ProjectResponse;
import com.resourcemanagement.exception.InvalidDateRangeException;
import com.resourcemanagement.exception.ProjectCodeExistedException;
import com.resourcemanagement.model.entity.Project;
import com.resourcemanagement.model.enums.ProjectStatus;
import com.resourcemanagement.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectService projectService;

    private Project project;
    private ProjectRequest validRequest;

    @BeforeEach
    void setUp() {
        project = Project.builder()
                .projectId(1L)
                .projectCode("PRJ001")
                .projectName("Test Project")
                .customer("Customer A")
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.of(2024, 1, 1))
                .endDate(LocalDate.of(2024, 12, 31))
                .build();

        validRequest = new ProjectRequest(
                "PRJ001",
                "Test Project",
                "Customer A",
                "ACTIVE",
                LocalDate.of(2024, 1, 1),
                LocalDate.of(2024, 12, 31)
        );
    }

    @Test
    void create_ValidRequest_ShouldSucceed() {
        // Arrange
        when(projectRepository.existsByProjectCode("PRJ001")).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenReturn(project);

        // Act
        ProjectResponse response = projectService.create(validRequest);

        // Assert
        assertNotNull(response);
        assertEquals("PRJ001", response.projectCode());
        assertEquals(ProjectStatus.ACTIVE, response.status());
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void create_DuplicateCode_ShouldThrowProjectCodeExistedException() {
        // Arrange
        when(projectRepository.existsByProjectCode("PRJ001")).thenReturn(true);

        // Act & Assert
        assertThrows(ProjectCodeExistedException.class, () -> projectService.create(validRequest));
        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void create_EndDateBeforeStartDate_ShouldThrowInvalidDateRangeException() {
        // Arrange
        ProjectRequest invalidRequest = new ProjectRequest(
                "PRJ002", "Invalid Project", "Customer B", "PLANNING",
                LocalDate.of(2024, 6, 1),  // startDate
                LocalDate.of(2024, 1, 1)   // endDate before startDate
        );
        when(projectRepository.existsByProjectCode("PRJ002")).thenReturn(false);

        // Act & Assert
        assertThrows(InvalidDateRangeException.class, () -> projectService.create(invalidRequest));
        verify(projectRepository, never()).save(any(Project.class));
    }
}
