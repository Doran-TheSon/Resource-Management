package com.resourcemanagement.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resourcemanagement.dto.response.AiRecommendationResponse;
import com.resourcemanagement.dto.response.AiRecommendationResponse.RecommendedResource;
import com.resourcemanagement.dto.response.RiskAnalysisResponse;
import com.resourcemanagement.dto.response.RiskAnalysisResponse.RiskItem;
import com.resourcemanagement.repository.AllocationRepository;
import com.resourcemanagement.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service xử lý AI features dùng Google Gemini API qua RestClient.
 *
 * Cách hoạt động — Hybrid Architecture:
 * 1. Gemini phân tích natural language query → trích xuất tham số tìm kiếm (JSON mode)
 * 2. Java code query DB bằng Repository (không để AI tự query)
 * 3. Gemini giải thích kết quả bằng ngôn ngữ tự nhiên
 *
 * ⚠️ AI KHÔNG tự query DB — nó chỉ parse NL và sinh explanation.
 * Query DB do Java code thực hiện → an toàn, chính xác, có kiểm soát.
 */
@Service
public class AiRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(AiRecommendationService.class);
    private static final int MAX_ALLOCATION = 100;
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final ResourceTools resourceTools;
    private final EmployeeRepository employeeRepository;
    private final AllocationRepository allocationRepository;

    public AiRecommendationService(@Value("${GEMINI_API_KEY:}") String apiKey,
                                    ResourceTools resourceTools,
                                    EmployeeRepository employeeRepository,
                                    AllocationRepository allocationRepository) {
        this.restClient = RestClient.builder()
                .baseUrl(GEMINI_API_URL + "?key=" + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
        this.objectMapper = new ObjectMapper();
        this.resourceTools = resourceTools;
        this.employeeRepository = employeeRepository;
        this.allocationRepository = allocationRepository;
    }

    // ======================== Public API ========================

    /**
     * AI Resource Recommendation.
     * User nhập NL query → AI phân tích → Java query DB → trả về danh sách đề xuất.
     */
    public AiRecommendationResponse recommend(String query) {
        log.info("AI recommend request: {}", query);

        // Bước 1: Gemini parse NL query → trích xuất tham số
        SearchCriteria criteria = extractSearchCriteria(query);

        // Bước 2: Java query DB với tham số đã trích xuất
        List<RecommendedResource> resources = findResources(criteria);

        // Bước 3: Gemini giải thích kết quả
        String explanation = generateRecommendationExplanation(query, criteria, resources);

        // Bước 4: Warning nếu không tìm thấy
        List<String> warnings = new ArrayList<>();
        if (resources.isEmpty()) {
            warnings.add("No matching resources found. Consider adjusting criteria.");
        }

        return new AiRecommendationResponse(query, explanation, resources, warnings.isEmpty() ? null : warnings);
    }

    /**
     * AI Risk Detection.
     * User nhập NL query → AI phân tích → Java lấy report → AI đánh giá risk.
     */
    public RiskAnalysisResponse analyzeRisk(String query) {
        log.info("AI risk analysis request: {}", query);

        // Bước 1: Gemini parse để hiểu user cần gì
        RiskContext riskContext = extractRiskContext(query);

        // Bước 2: Java lấy dữ liệu từ DB (hoàn toàn chủ động, không qua AI)
        List<ResourceTools.EmployeeUtilization> overloaded = resourceTools.getOverloadedResources();
        List<ResourceTools.EmployeeUtilization> available = resourceTools.getAvailableResources();
        List<ResourceTools.RoleCount> roleCounts = resourceTools.countEmployeesByRole();
        long totalAllocated = allocationRepository.countDistinctAllocatedEmployees();
        long totalEmployees = employeeRepository.count();

        // Bước 3: Gemini đánh giá risk dựa trên số liệu thực từ DB
        String riskDataJson = buildRiskDataJson(riskContext, overloaded, available, roleCounts, totalAllocated, totalEmployees);
        String assessment = generateRiskAssessment(query, riskDataJson);

        // Bước 4: Java tính risk items từ số liệu (logic chủ động, không phụ thuộc AI)
        List<RiskItem> riskItems = calculateRiskItems(overloaded, available, totalEmployees, totalAllocated);

        // Bước 5: Suggestions từ Java
        List<String> suggestions = calculateSuggestions(riskItems, available.size());

        return new RiskAnalysisResponse(query, assessment, riskItems, suggestions);
    }

    // ======================== Gemini API calls ========================

    /**
     * Gọi Gemini API với prompt, trả về text content.
     * Dùng RestClient thuần — không cần Spring AI dependency.
     */
    private String callGemini(String prompt) {
        try {
            // Build request body
            String requestBody = objectMapper.writeValueAsString(new GeminiRequest(prompt));

            // Call API
            String responseBody = restClient.post()
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            // Parse response
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text");
            return text.asText();

        } catch (Exception e) {
            log.warn("Gemini API call failed: {}", e.getMessage());
            return "";
        }
    }

    /**
     * Gọi Gemini với response ở dạng JSON.
     */
    private <T> T callGeminiJson(String prompt, Class<T> responseType) {
        String jsonPrompt = prompt + "\n\nReturn ONLY valid JSON, no markdown, no explanation.";
        String response = callGemini(jsonPrompt);

        // Clean response — loại bỏ markdown code block nếu có
        response = response.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        if (response.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(response, responseType);
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse Gemini JSON response: {}", e.getMessage());
            return null;
        }
    }

    // ======================== Parse & Extract ========================

    private SearchCriteria extractSearchCriteria(String query) {
        String prompt = """
                You are a resource allocation assistant. Extract search criteria from the user's request below.
                Return a JSON object with these fields (all nullable):
                - "role": the job role or skill mentioned (e.g. "Java Developer", "Senior Developer", "Designer"). Use null if not specified.
                - "department": the department name if mentioned (e.g. "IT", "FSOFT-Q1"). Use null if not specified.
                - "minAvailable": minimum available percentage as a number (e.g. 50 means at least 50%% free time). Use null if not specified.

                Query: %s
                """.formatted(query);

        SearchCriteria criteria = callGeminiJson(prompt, SearchCriteria.class);
        if (criteria == null) {
            log.warn("Gemini extractSearchCriteria returned null, using fallback");
            return fallbackParse(query);
        }
        return criteria;
    }

    private RiskContext extractRiskContext(String query) {
        String prompt = """
                Extract risk analysis context from the user's request below.
                Return a JSON object with these fields:
                - "requestDescription": short description of what the user wants (e.g. "need 2 more Java Devs")
                - "requestedHeadcount": number of people requested, or null if not specified
                - "roleNeeded": the role/title mentioned, or null if not specified

                Query: %s
                """.formatted(query);

        RiskContext ctx = callGeminiJson(prompt, RiskContext.class);
        return ctx != null ? ctx : new RiskContext(query, null, null);
    }

    // ======================== Explanation & Assessment ========================

    private String generateRecommendationExplanation(String query, SearchCriteria criteria,
                                                      List<RecommendedResource> resources) {
        if (resources.isEmpty()) {
            return "Không tìm thấy resource phù hợp với yêu cầu của bạn. Hãy thử giảm yêu cầu % available hoặc tìm role khác.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Dựa trên yêu cầu của bạn, tôi tìm thấy ").append(resources.size()).append(" resource phù hợp:\n\n");
        for (RecommendedResource r : resources) {
            sb.append("• **").append(r.employeeName()).append("** — ")
              .append(r.role()).append(" (").append(r.department()).append(")")
              .append(" — available: **").append(r.available()).append("%**");
            if (r.currentProjects() != null && !r.currentProjects().isEmpty()) {
                sb.append(" — Dự án hiện tại: ").append(String.join(", ", r.currentProjects()));
            }
            sb.append("\n");
        }
        sb.append("\n💡 *Bạn có thể liên hệ trực tiếp với các resource trên để thảo luận về việc phân bổ công việc.*");

        return sb.toString();
    }

    private String buildRiskDataJson(RiskContext ctx,
                                      List<ResourceTools.EmployeeUtilization> overloaded,
                                      List<ResourceTools.EmployeeUtilization> available,
                                      List<ResourceTools.RoleCount> roleCounts,
                                      long totalAllocated, long totalEmployees) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"totalEmployees\": ").append(totalEmployees).append(",\n");
        sb.append("  \"currentlyAllocated\": ").append(totalAllocated).append(",\n");
        sb.append("  \"overloadedCount\": ").append(overloaded.size()).append(",\n");
        sb.append("  \"availableCount\": ").append(available.size()).append(",\n");
        sb.append("  \"requestedHeadcount\": ").append(ctx.requestedHeadcount() != null ? ctx.requestedHeadcount() : "null").append(",\n");
        sb.append("  \"roleNeeded\": ").append(ctx.roleNeeded() != null ? "\"" + ctx.roleNeeded() + "\"" : "null").append(",\n");
        sb.append("  \"requestDescription\": \"").append(ctx.requestDescription()).append("\"\n");
        sb.append("}");
        return sb.toString();
    }

    private String generateRiskAssessment(String query, String riskDataJson) {
        String prompt = """
                You are a risk assessment assistant for resource management.
                Analyze the risk based on the data below and the user's request.

                User request: %s

                Current data: %s

                Provide a concise risk assessment in Vietnamese (2-4 sentences).
                Focus on: capacity issues, potential bottlenecks, and whether the request is feasible.
                """.formatted(query, riskDataJson);

        String assessment = callGemini(prompt);
        if (assessment.isEmpty()) {
            return "Không thể tạo đánh giá rủi ro tự động. Vui lòng kiểm tra dữ liệu thủ công.";
        }
        return assessment;
    }

    // ======================== DB Query Helpers ========================

    private SearchCriteria fallbackParse(String query) {
        String role = null;
        String department = null;
        Integer minAvailable = null;
        String lower = query.toLowerCase();

        // Role keywords
        String[] roleKeywords = {"developer", "designer", "tester", "pm", "ba", "senior", "junior", "java",
                                 "frontend", "backend", "dev", "leader", "architect", "fresher"};
        for (String kw : roleKeywords) {
            if (lower.contains(kw)) {
                int idx = lower.indexOf(kw);
                int start = Math.max(0, idx - 15);
                int end = Math.min(lower.length(), idx + kw.length() + 15);
                role = query.substring(start, end).trim();
                break;
            }
        }

        // Department
        if (lower.contains("it") || lower.contains("fsoft") || lower.contains("technology")) department = "IT";
        if (lower.contains("design") || lower.contains("ui") || lower.contains("ux")) department = "Design";
        if (lower.contains("hr") || lower.contains("human resource")) department = "HR";

        // Số %
        Pattern p = Pattern.compile("(\\d+)\\s*%");
        Matcher m = p.matcher(lower);
        if (m.find()) {
            minAvailable = Integer.parseInt(m.group(1));
        } else {
            // fallback: tìm số bất kỳ
            String[] words = lower.split("\\s+");
            for (String w : words) {
                String digits = w.replaceAll("[^0-9]", "");
                if (!digits.isEmpty()) {
                    try {
                        int val = Integer.parseInt(digits);
                        if (val > 0 && val <= 100) {
                            minAvailable = val;
                            break;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        return new SearchCriteria(role, department, minAvailable);
    }

    private List<RecommendedResource> findResources(SearchCriteria criteria) {
        if (criteria.role != null && !criteria.role.isBlank()) {
            int minAvail = criteria.minAvailable != null ? criteria.minAvailable : 0;
            return resourceTools.findEmployees(criteria.role, criteria.department, minAvail);
        } else if (criteria.minAvailable != null) {
            return resourceTools.findEmployees(null, criteria.department, criteria.minAvailable);
        } else {
            return resourceTools.findEmployees(null, criteria.department, 0);
        }
    }

    // ======================== Risk Logic (Java, not AI) ========================

    private List<RiskItem> calculateRiskItems(List<ResourceTools.EmployeeUtilization> overloaded,
                                               List<ResourceTools.EmployeeUtilization> available,
                                               long totalEmployees, long totalAllocated) {
        List<RiskItem> items = new ArrayList<>();

        if (!overloaded.isEmpty()) {
            String names = overloaded.stream()
                    .map(ResourceTools.EmployeeUtilization::fullName)
                    .limit(5)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            items.add(new RiskItem(
                    "OVERLOAD",
                    overloaded.size() + " nhân viên đang quá tải (>90% allocation)",
                    overloaded.size() > 3 ? "HIGH" : "MEDIUM",
                    "Nguy cơ burnout, chậm tiến độ cho: " + names
            ));
        }

        double utilizationRate = totalEmployees > 0 ? (double) totalAllocated / totalEmployees * 100 : 0;
        if (utilizationRate > 80) {
            items.add(new RiskItem(
                    "CAPACITY",
                    String.format("Team đang ở mức %.0f%% utilization (%d/%d người đã được allocate)",
                            utilizationRate, totalAllocated, totalEmployees),
                    utilizationRate > 90 ? "HIGH" : "MEDIUM",
                    "Rất ít buffer cho yêu cầu mới. Cần cân nhắc kỹ trước khi nhận thêm việc."
            ));
        }

        long trulyAvailable = available.stream()
                .filter(a -> a.totalAllocation() < 50)
                .count();
        if (trulyAvailable < 3) {
            items.add(new RiskItem(
                    "AVAILABILITY",
                    "Chỉ còn " + trulyAvailable + " người có >50% quỹ thời gian rảnh",
                    "HIGH",
                    "Nguồn lực rất hạn chế. Cân nhắc tuyển thêm hoặc ưu tiên lại dự án."
            ));
        }

        if (items.isEmpty()) {
            items.add(new RiskItem(
                    "OK",
                    "Team capacity đang ở trạng thái tốt",
                    "LOW",
                    "Phân bổ nguồn lực hiện tại đang cân bằng."
            ));
        }

        return items;
    }

    private List<String> calculateSuggestions(List<RiskItem> riskItems, int availableCount) {
        List<String> suggestions = new ArrayList<>();
        for (RiskItem item : riskItems) {
            switch (item.type()) {
                case "OVERLOAD" -> {
                    suggestions.add("Phân bổ lại công việc từ người quá tải sang người còn trống.");
                    suggestions.add("Xem xét gia hạn timeline dự án để giảm áp lực.");
                }
                case "CAPACITY" -> suggestions.add("Đánh giá xem có thể dời yêu cầu mới sang sprint sau không.");
                case "AVAILABILITY" -> {
                    suggestions.add("Hiện có " + availableCount + " người còn quỹ thời gian — kiểm tra khả năng nhận thêm việc.");
                    suggestions.add("Nếu không có nội bộ, cân nhắc hiring hoặc outsourcing.");
                }
            }
        }
        if (suggestions.isEmpty()) {
            suggestions.add("Capacity hiện tại đủ đáp ứng. Không cần hành động ngay.");
        }
        return suggestions;
    }

    // ======================== Inner types ========================

    /**
     * Search criteria parsed from NL query.
     */
    private record SearchCriteria(String role, String department, Integer minAvailable) {}

    /**
     * Context extracted for risk analysis.
     */
    private record RiskContext(String requestDescription, Integer requestedHeadcount, String roleNeeded) {}

    /**
     * Gemini API request body model.
     */
    private record GeminiRequest(String contents) {
        public String getContents() { return contents; }
    }
}
