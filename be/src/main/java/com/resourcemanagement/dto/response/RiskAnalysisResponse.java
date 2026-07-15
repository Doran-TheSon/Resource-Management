package com.resourcemanagement.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RiskAnalysisResponse(
    String query,
    String overallAssessment,
    List<RiskItem> risks,
    List<String> suggestions
) {
    public record RiskItem(
        String type,
        String description,
        String severity,
        String impact
    ) {}
}
