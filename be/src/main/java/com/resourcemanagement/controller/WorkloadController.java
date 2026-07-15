package com.resourcemanagement.controller;

import com.resourcemanagement.dto.ApiResponse;
import com.resourcemanagement.dto.response.WorkloadResponse;
import com.resourcemanagement.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WorkloadController {

    private final AllocationService allocationService;

    @GetMapping("/employees/{id}/workload")
    public ResponseEntity<ApiResponse<WorkloadResponse>> getWorkload(@PathVariable Long id) {
        WorkloadResponse workload = allocationService.getWorkload(id);
        return ResponseEntity.ok(ApiResponse.success(workload));
    }
}
