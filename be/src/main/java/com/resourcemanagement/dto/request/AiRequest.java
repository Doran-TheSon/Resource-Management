package com.resourcemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AiRequest(
    @NotBlank(message = "Query is required")
    String query
) {}
