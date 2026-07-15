package com.resourcemanagement.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiRecommendationResponse(
    String query,
    String explanation,
    List<RecommendedResource> recommendedResources,
    List<String> warnings
) {
    public record RecommendedResource(
        Long employeeId,
        String employeeName,
        String role,
        String department,
        String email,
        int available,
        List<String> currentProjects
    ) {}
}
