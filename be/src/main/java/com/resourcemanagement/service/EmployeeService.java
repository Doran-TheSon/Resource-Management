package com.resourcemanagement.service;

import com.resourcemanagement.dto.request.EmployeeRequest;
import com.resourcemanagement.dto.response.EmployeeResponse;
import com.resourcemanagement.exception.EmployeeCodeExistedException;
import com.resourcemanagement.exception.EmployeeNotFoundException;
import com.resourcemanagement.model.entity.Employee;
import com.resourcemanagement.repository.EmployeeRepository;
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
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);
    private final EmployeeRepository employeeRepository;

    public List<EmployeeResponse> findAll(int page, int size, String department, String role) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("fullName").ascending());
        Page<Employee> employees;

        if (department != null && role != null) {
            employees = employeeRepository.findByDepartmentAndRole(department, role, pageRequest);
        } else if (department != null) {
            employees = employeeRepository.findByDepartment(department, pageRequest);
        } else if (role != null) {
            employees = employeeRepository.findByRole(role, pageRequest);
        } else {
            employees = employeeRepository.findAll(pageRequest);
        }

        return employees.stream().map(this::toResponse).toList();
    }

    public EmployeeResponse findById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
        return toResponse(employee);
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        if (employeeRepository.existsByEmployeeCode(request.employeeCode())) {
            throw new EmployeeCodeExistedException(request.employeeCode());
        }

        Employee employee = Employee.builder()
                .employeeCode(request.employeeCode())
                .fullName(request.fullName())
                .email(request.email())
                .role(request.role())
                .department(request.department())
                .build();

        employee = employeeRepository.save(employee);
        log.info("Created employee: code={}, name={}", employee.getEmployeeCode(), employee.getFullName());
        return toResponse(employee);
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));

        // Nếu đổi employeeCode, check không trùng
        if (!employee.getEmployeeCode().equals(request.employeeCode())
                && employeeRepository.existsByEmployeeCode(request.employeeCode())) {
            throw new EmployeeCodeExistedException(request.employeeCode());
        }

        employee.setEmployeeCode(request.employeeCode());
        employee.setFullName(request.fullName());
        employee.setEmail(request.email());
        employee.setRole(request.role());
        employee.setDepartment(request.department());

        employee = employeeRepository.save(employee);
        log.info("Updated employee: id={}, code={}", id, employee.getEmployeeCode());
        return toResponse(employee);
    }

    @Transactional
    public void delete(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new EmployeeNotFoundException(id);
        }
        employeeRepository.deleteById(id);
        log.info("Deleted employee: id={}", id);
    }

    private EmployeeResponse toResponse(Employee e) {
        return new EmployeeResponse(
            e.getEmployeeId(), e.getEmployeeCode(), e.getFullName(),
            e.getEmail(), e.getRole(), e.getDepartment(),
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}
