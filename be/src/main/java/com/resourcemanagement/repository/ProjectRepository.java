package com.resourcemanagement.repository;

import com.resourcemanagement.model.entity.Project;
import com.resourcemanagement.model.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByProjectCode(String projectCode);

    Page<Project> findByStatus(ProjectStatus status, Pageable pageable);

    Page<Project> findByCustomerContainingIgnoreCase(String customer, Pageable pageable);

    List<Project> findByStatusNot(ProjectStatus status);
}
