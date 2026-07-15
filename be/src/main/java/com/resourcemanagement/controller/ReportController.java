package com.resourcemanagement.controller;

import com.resourcemanagement.dto.ApiResponse;
import com.resourcemanagement.dto.response.EmployeeUtilizationDTO;
import com.resourcemanagement.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final AllocationService allocationService;

    @GetMapping("/utilization")
    public ResponseEntity<ApiResponse<List<EmployeeUtilizationDTO>>> getUtilization() {
        List<EmployeeUtilizationDTO> report = allocationService.getUtilizationReport();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/available-resources")
    public ResponseEntity<ApiResponse<List<EmployeeUtilizationDTO>>> getAvailable() {
        List<EmployeeUtilizationDTO> report = allocationService.getAvailableResources();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/overloaded")
    public ResponseEntity<ApiResponse<List<EmployeeUtilizationDTO>>> getOverloaded() {
        List<EmployeeUtilizationDTO> report = allocationService.getOverloadedResources();
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
