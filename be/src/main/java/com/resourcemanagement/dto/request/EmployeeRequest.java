package com.resourcemanagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record EmployeeRequest(
    @NotBlank(message = "Employee code is required")
    @Pattern(regexp = "^[A-Z0-9]{3,20}$", message = "Employee code must be 3-20 uppercase alphanumeric characters")
    String employeeCode,

    @NotBlank(message = "Full name is required")
    String fullName,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Role is required")
    String role,

    @NotBlank(message = "Department is required")
    String department
) {}
