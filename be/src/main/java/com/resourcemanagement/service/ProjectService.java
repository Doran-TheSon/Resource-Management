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
