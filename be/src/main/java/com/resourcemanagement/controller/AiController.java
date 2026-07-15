package com.resourcemanagement.controller;

import com.resourcemanagement.dto.ApiResponse;
import com.resourcemanagement.dto.request.AiRequest;
import com.resourcemanagement.dto.response.AiRecommendationResponse;
import com.resourcemanagement.dto.response.RiskAnalysisResponse;
import com.resourcemanagement.ai.AiRecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiRecommendationService aiRecommendationService;

    /**
     * POST /api/v1/ai/recommend
     * AI Resource Recommendation — tìm nhân sự phù hợp dựa trên yêu cầu bằng ngôn ngữ tự nhiên.
     *
     * Ví dụ: "Tìm Java Developer còn tối thiểu 50% available"
     */
    @PostMapping("/recommend")
    public ResponseEntity<ApiResponse<AiRecommendationResponse>> recommend(
            @Valid @RequestBody AiRequest request) {
        AiRecommendationResponse response = aiRecommendationService.recommend(request.query());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/ai/risk-analysis
     * AI Risk Detection — phân tích rủi ro về capacity khi user yêu cầu thêm nhân sự.
     *
     * Ví dụ: "Sprint tới cần thêm 2 Java Developer"
     */
    @PostMapping("/risk-analysis")
    public ResponseEntity<ApiResponse<RiskAnalysisResponse>> analyzeRisk(
            @Valid @RequestBody AiRequest request) {
        RiskAnalysisResponse response = aiRecommendationService.analyzeRisk(request.query());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
