package com.resourcemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resourcemanagement.dto.request.EmployeeRequest;
import com.resourcemanagement.dto.response.EmployeeResponse;
import com.resourcemanagement.exception.EmployeeNotFoundException;
import com.resourcemanagement.service.EmployeeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmployeeController.class)
class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EmployeeService employeeService;

    @Test
    void getAll_ShouldReturn200() throws Exception {
        List<EmployeeResponse> list = List.of(
                new EmployeeResponse(1L, "EMP001", "Alice", "alice@test.com", "Dev", "FSOFT",
                        LocalDateTime.now(), LocalDateTime.now())
        );
        when(employeeService.findAll(anyInt(), anyInt(), isNull(), isNull())).thenReturn(list);

        mockMvc.perform(get("/api/v1/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void getById_Existing_ShouldReturn200() throws Exception {
        EmployeeResponse emp = new EmployeeResponse(1L, "EMP001", "Alice", "alice@test.com", "Dev", "FSOFT",
                LocalDateTime.now(), LocalDateTime.now());
        when(employeeService.findById(1L)).thenReturn(emp);

        mockMvc.perform(get("/api/v1/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.employeeCode").value("EMP001"));
    }

    @Test
    void getById_NonExisting_ShouldReturn404() throws Exception {
        when(employeeService.findById(99L)).thenThrow(new EmployeeNotFoundException(99L));

        mockMvc.perform(get("/api/v1/employees/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("EMPLOYEE_NOT_FOUND"));
    }

    @Test
    void create_ValidRequest_ShouldReturn201() throws Exception {
        EmployeeRequest request = new EmployeeRequest("EMP002", "Bob", "bob@test.com", "Dev", "FSOFT");
        EmployeeResponse response = new EmployeeResponse(2L, "EMP002", "Bob", "bob@test.com", "Dev", "FSOFT",
                LocalDateTime.now(), LocalDateTime.now());
        when(employeeService.create(any(EmployeeRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Employee created successfully"));
    }

    @Test
    void create_InvalidRequest_ShouldReturn400() throws Exception {
        EmployeeRequest request = new EmployeeRequest("", "", "invalid-email", "", "");

        mockMvc.perform(post("/api/v1/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }
}
