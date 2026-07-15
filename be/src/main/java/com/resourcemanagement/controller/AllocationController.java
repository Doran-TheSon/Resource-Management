package com.resourcemanagement.controller;

import com.resourcemanagement.dto.ApiResponse;
import com.resourcemanagement.dto.request.AllocationRequest;
import com.resourcemanagement.dto.response.AllocationResponse;
import com.resourcemanagement.service.AllocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/allocations")
@RequiredArgsConstructor
public class AllocationController {

    private final AllocationService allocationService;

    @PostMapping
    public ResponseEntity<ApiResponse<AllocationResponse>> create(@Valid @RequestBody AllocationRequest request) {
        AllocationResponse allocation = allocationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(allocation, "Allocation created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AllocationResponse>>> getAll() {
        List<AllocationResponse> list = allocationService.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AllocationResponse>> getById(@PathVariable Long id) {
        AllocationResponse allocation = allocationService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(allocation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AllocationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AllocationRequest request) {
        AllocationResponse allocation = allocationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(allocation, "Allocation updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        allocationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
