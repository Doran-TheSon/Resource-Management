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
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service xử lý AI features với 3 tầng fallback:
 * <p>
 * Tầng 1 — OpenRouter (GPT-4o-mini) hoặc Google Gemini
 * Tầng 2 — Retry với prompt đơn giản hơn nếu tầng 1 fail
 * Tầng 3 — Java regex fallbackParse (không cần AI)
 * <p>
 * Kiến trúc Hybrid:
 * - LLM chỉ parse NL query + sinh explanation (không tự query DB)
 * - Java code query DB bằng Repository — an toàn, chính xác
 */
@Service
public class AiRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(AiRecommendationService.class);

    // OpenRouter
    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final String OPENROUTER_DEFAULT_MODEL = "google/gemma-4-31b:free";

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final ResourceTools resourceTools;
    private final EmployeeRepository employeeRepository;
    private final AllocationRepository allocationRepository;
    private final boolean useOpenRouter;
    private final String modelName;

    public AiRecommendationService(@Value("${GEMINI_API_KEY:}") String apiKey,
                                    @Value("${AI_MODEL:}") String aiModel,
                                    ResourceTools resourceTools,
                                    EmployeeRepository employeeRepository,
                                    AllocationRepository allocationRepository) {
        this.useOpenRouter = apiKey != null && apiKey.startsWith("sk-or");
        this.objectMapper = new ObjectMapper();
        this.resourceTools = resourceTools;
        this.employeeRepository = employeeRepository;
        this.allocationRepository = allocationRepository;

        if (useOpenRouter) {
            this.modelName = (aiModel != null && !aiModel.isBlank()) ? aiModel : OPENROUTER_DEFAULT_MODEL;
            log.info("Using OpenRouter AI provider, model: {}", modelName);
            this.restClient = RestClient.builder()
                    .baseUrl(OPENROUTER_API_URL)
                    .defaultHeader("Content-Type", "application/json")
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .defaultHeader("HTTP-Referer", "http://localhost:5173")
                    .defaultHeader("X-Title", "Resource Management System")
                    .build();
        } else {
            this.modelName = null;
            log.info("Using Google Gemini AI provider");
            this.restClient = RestClient.builder()
                    .baseUrl(GEMINI_API_URL + "?key=" + apiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();
        }
    }

    // ======================== Public API ========================

    /**
     * AI Resource Recommendation với 3 tầng fallback.
     */
    public AiRecommendationResponse recommend(String query) {
        log.info("AI recommend request: {}", query);

        // Tầng 1 + 2: LLM parse → fallback regex nếu LLM fail
        SearchCriteria criteria = extractSearchCriteriaWithFallback(query);

        // Query DB với criteria đã parse
        List<RecommendedResource> resources = findResources(criteria);

        // Sinh explanation (dùng LLM nếu được, ko thì hardcoded thông minh)
        String explanation = generateSmartExplanation(query, criteria, resources);

        // Warning nếu empty
        List<String> warnings = new ArrayList<>();
        if (resources.isEmpty()) {
            String hint = buildEmptyResultHint(criteria);
            warnings.add(hint);
        }

        return new AiRecommendationResponse(query, explanation, resources, warnings.isEmpty() ? null : warnings);
    }

    /**
     * AI Risk Detection với fallback hoàn chỉnh bằng Java.
     */
    public RiskAnalysisResponse analyzeRisk(String query) {
        log.info("AI risk analysis request: {}", query);

        // Bước 1: Parse context — LLM → fallback
        RiskContext riskContext = extractRiskContextWithFallback(query);

        // Bước 2: Java query DB
        List<ResourceTools.EmployeeUtilization> overloaded = resourceTools.getOverloadedResources();
        List<ResourceTools.EmployeeUtilization> available = resourceTools.getAvailableResources();
        List<ResourceTools.RoleCount> roleCounts = resourceTools.countEmployeesByRole();
        long totalAllocated = allocationRepository.countDistinctAllocatedEmployees();
        long totalEmployees = employeeRepository.count();

        // Bước 3: Risk items + suggestions luôn tính bằng Java
        List<RiskItem> riskItems = calculateRiskItems(overloaded, available, totalEmployees, totalAllocated);
        List<String> suggestions = calculateSuggestions(riskItems, available.size());

        // Bước 4: Assessment — LLM → fallback Java
        String assessment = generateRiskAssessmentWithFallback(query, riskContext, overloaded, available,
                totalAllocated, totalEmployees);

        return new RiskAnalysisResponse(query, assessment, riskItems, suggestions);
    }

    // ======================== LLM API calls với fallback ========================

    /**
     * Gọi LLM — nếu fail trả về empty để fallback xử lý.
     */
    private String callLLM(String prompt) {
        return callLLMWithModel(prompt);
    }

    /**
     * Gọi LLM — có fallback retry khi fail.
     */
    private String callLLMWithModel(String prompt) {
        // Attempt 1: gọi LLM
        String result = tryCallLLM(prompt);
        if (!result.isEmpty()) return result;

        // Attempt 2: thử với prompt rút gọn (loại bỏ instruction phức tạp)
        log.info("LLM call failed, retrying with simplified prompt");
        String simplePrompt = prompt.length() > 1000 ? prompt.substring(0, 1000) : prompt;
        result = tryCallLLM(simplePrompt);
        if (!result.isEmpty()) return result;

        log.warn("All LLM attempts failed");
        return "";
    }

    private String tryCallLLM(String prompt) {
        try {
            String requestBody;
            if (useOpenRouter) {
                requestBody = objectMapper.writeValueAsString(Map.of(
                        "model", modelName,
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "temperature", 0.2,
                        "max_tokens", 1024
                ));
            } else {
                requestBody = objectMapper.writeValueAsString(new GeminiRequest(prompt));
            }

            String responseBody = restClient.post()
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            if (useOpenRouter) {
                String content = root.path("choices").get(0)
                        .path("message").path("content")
                        .asText();
                if (!content.isEmpty() && !content.isBlank()) return content;
            } else {
                String text = root.path("candidates").get(0)
                        .path("content").path("parts").get(0)
                        .path("text").asText();
                if (!text.isEmpty() && !text.isBlank()) return text;
            }
        } catch (Exception e) {
            log.warn("LLM call attempt failed: {}", e.getMessage());
        }
        return "";
    }

    /**
     * Gọi LLM với JSON response — 3 tầng fallback.
     */
    private <T> T callLLMJsonWithFallback(String prompt, Class<T> responseType,
                                          String simplePromptFallback) {
        // Tầng 1: Full prompt với primary model
        String jsonPrompt = prompt + "\n\nReturn ONLY valid JSON, no markdown, no explanation.";
        String response = callLLM(jsonPrompt);
        T result = parseJsonResponse(response, responseType);
        if (result != null) return result;

        // Tầng 2: Simple prompt (nếu có)
        if (simplePromptFallback != null) {
            log.info("LLM JSON parsing failed, trying simplified prompt");
            String simpleJsonPrompt = simplePromptFallback + "\n\nReturn ONLY valid JSON.";
            response = callLLM(simpleJsonPrompt);
            result = parseJsonResponse(response, responseType);
            if (result != null) return result;
        }

        return null; // Tầng 3: caller xử lý fallback
    }

    private <T> T parseJsonResponse(String response, Class<T> responseType) {
        if (response == null || response.isEmpty()) return null;
        String cleaned = response.replaceAll("```json\\s*", "")
                .replaceAll("```\\s*", "").trim();
        if (cleaned.isEmpty()) return null;
        try {
            return objectMapper.readValue(cleaned, responseType);
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse JSON response: {}", e.getMessage());
            return null;
        }
    }

    // ======================== Extract với fallback ========================

    /**
     * Trích xuất search criteria — 3 tầng: LLM → LLM đơn giản → Java regex.
     */
    private SearchCriteria extractSearchCriteriaWithFallback(String query) {
        // Tầng 1: Full prompt
        String fullPrompt = """
                Extract search criteria from the user query below.
                Return JSON: {"role": string|null, "department": string|null, "minAvailable": number|null}
                role = just the job title (e.g. "Developer" from "Java Developer"), NOT the full phrase.
                minAvailable = minimum free percentage as number (e.g. 50).

                Examples:
                "Tìm Java Developer còn tối thiểu 50%% available" → {"role":"Developer","department":null,"minAvailable":50}
                "Find Senior Developer in FSOFT-Q1 with 30%% free" → {"role":"Senior Developer","department":"FSOFT-Q1","minAvailable":30}

                Query: %s
                """.formatted(query);

        // Tầng 2: Simple prompt
        String simplePrompt = """
                Return JSON: {"role": string or null, "department": string or null, "minAvailable": number or null}
                Query: %s
                """.formatted(query);

        SearchCriteria criteria = callLLMJsonWithFallback(fullPrompt, SearchCriteria.class, simplePrompt);
        if (criteria != null && isValidCriteria(criteria)) {
            log.info("LLM parsed criteria: role={}, dept={}, minAvail={}",
                    criteria.role, criteria.department, criteria.minAvailable);
            return criteria;
        }

        // Tầng 3: Java regex fallback
        log.warn("LLM criteria parsing failed, using Java regex fallback");
        return fallbackParse(query);
    }

    private boolean isValidCriteria(SearchCriteria c) {
        return (c.role != null && !c.role.isBlank())
                || (c.department != null && !c.department.isBlank())
                || c.minAvailable != null;
    }

    /**
     * Trích xuất risk context — 3 tầng: LLM → LLM đơn giản → Java regex.
     */
    private RiskContext extractRiskContextWithFallback(String query) {
        String fullPrompt = """
                Extract risk analysis context. Return JSON:
                {"requestDescription": string, "requestedHeadcount": number|null, "roleNeeded": string|null}
                Query: %s
                """.formatted(query);

        String simplePrompt = """
                Return JSON: {"requestDescription": string, "requestedHeadcount": number|null, "roleNeeded": string|null}
                Query: %s
                """.formatted(query);

        RiskContext ctx = callLLMJsonWithFallback(fullPrompt, RiskContext.class, simplePrompt);
        if (ctx != null) return ctx;

        // Fallback: parse bằng Java
        return fallbackParseRiskContext(query);
    }

    // ======================== Explanation với fallback ========================

    /**
     * Sinh explanation — LLM → hardcoded thông minh (có statistics).
     */
    private String generateSmartExplanation(String query, SearchCriteria criteria,
                                            List<RecommendedResource> resources) {
        if (!resources.isEmpty()) {
            // Thử dùng LLM để sinh explanation tự nhiên
            String prompt = """
                    You are a resource assistant. Explain these search results in Vietnamese (2-3 sentences).
                    Query: "%s"
                    Found %d matching resource(s). List their names, roles, and available percentages.
                    """.formatted(query, resources.size());

            String llmResult = callLLM(prompt);
            if (!llmResult.isEmpty()) return llmResult;
        }

        // Fallback: hardcoded thông minh
        if (resources.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append("Không tìm thấy resource phù hợp.");
            if (criteria.role != null) {
                sb.append(" Yêu cầu role: \"").append(criteria.role).append("\".");
            }
            if (criteria.minAvailable != null) {
                sb.append(" Yêu cầu available tối thiểu: ").append(criteria.minAvailable).append("%.");
            }
            sb.append(" Thử giảm yêu cầu hoặc tìm role khác.");
            return sb.toString();
        }

        // Fallback: tự sinh explanation từ dữ liệu
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

    /**
     * Warning thông minh khi không tìm thấy.
     */
    private String buildEmptyResultHint(SearchCriteria criteria) {
        List<String> hints = new ArrayList<>();
        hints.add("No matching resources found.");

        if (criteria.role != null) {
            // Đếm tổng employee theo role để gợi ý
            long totalByRole = employeeRepository.findByRoleContainingIgnoreCase(criteria.role).size();
            if (totalByRole > 0) {
                hints.add("There are " + totalByRole + " employee(s) with role containing \"" + criteria.role
                        + "\" but none meet the available threshold.");
            } else {
                hints.add("No employees found with role containing \"" + criteria.role + "\".");
                // Gợi ý các role có trong DB
                List<String> allRoles = employeeRepository.findAll().stream()
                        .map(e -> e.getRole())
                        .distinct()
                        .toList();
                if (!allRoles.isEmpty()) {
                    hints.add("Available roles in system: " + String.join(", ", allRoles) + ".");
                }
            }
        }

        if (criteria.minAvailable != null && criteria.minAvailable > 0) {
            hints.add("Try reducing the minimum available percentage.");
        }

        hints.add("Consider adjusting your search criteria.");
        return String.join(" ", hints);
    }

    // ======================== Risk Assessment với fallback ========================

    /**
     * Risk assessment — LLM → Java tự đánh giá (không static message).
     */
    private String generateRiskAssessmentWithFallback(String query,
                                                      RiskContext riskContext,
                                                      List<ResourceTools.EmployeeUtilization> overloaded,
                                                      List<ResourceTools.EmployeeUtilization> available,
                                                      long totalAllocated, long totalEmployees) {
        // Tầng 1: Dùng LLM
        String riskDataJson = buildRiskDataJson(riskContext, overloaded, available, null,
                totalAllocated, totalEmployees);
        String prompt = """
                Analyze capacity risk. Return a concise assessment in Vietnamese (2-4 sentences).
                User request: %s
                Data: %s
                """.formatted(query, riskDataJson);

        String llmResult = callLLM(prompt);
        if (!llmResult.isEmpty()) return llmResult;

        // Tầng 2: Java tự sinh assessment từ số liệu
        return buildJavaRiskAssessment(overloaded, available, totalAllocated, totalEmployees, riskContext);
    }

    /**
     * Java tự đánh giá risk dựa trên số liệu — không cần LLM.
     */
    private String buildJavaRiskAssessment(List<ResourceTools.EmployeeUtilization> overloaded,
                                           List<ResourceTools.EmployeeUtilization> available,
                                           long totalAllocated, long totalEmployees,
                                           RiskContext riskContext) {
        double utilizationRate = totalEmployees > 0
                ? (double) totalAllocated / totalEmployees * 100 : 0;
        long trulyAvailable = available.stream()
                .filter(a -> a.totalAllocation() < 50)
                .count();

        StringBuilder sb = new StringBuilder();
        sb.append("Đánh giá capacity hiện tại:\n");

        sb.append("- ").append(totalAllocated).append("/").append(totalEmployees)
                .append(" nhân viên đã được allocate (").append(String.format("%.0f", utilizationRate)).append("%).\n");

        if (!overloaded.isEmpty()) {
            sb.append("- ").append(overloaded.size()).append(" nhân viên đang quá tải (>90%). ");
            sb.append("Cần cân nhắc phân bổ lại.\n");
        }

        sb.append("- ").append(trulyAvailable).append(" người còn >50% quỹ thời gian.\n");

        if (riskContext.requestedHeadcount() != null) {
            if (trulyAvailable >= riskContext.requestedHeadcount()) {
                sb.append("Yêu cầu thêm ").append(riskContext.requestedHeadcount())
                        .append(" người khả thi về mặt số lượng, nhưng cần kiểm tra kỹ năng phù hợp.\n");
            } else {
                sb.append("Yêu cầu thêm ").append(riskContext.requestedHeadcount())
                        .append(" người KHÔNG khả thi với capacity hiện tại (chỉ còn ")
                        .append(trulyAvailable).append(" người có quỹ thời gian lớn).\n");
            }
        }

        return sb.toString();
    }

    // ======================== Java Fallback Parsers ========================

    private SearchCriteria fallbackParse(String query) {
        String role = null;
        String department = null;
        Integer minAvailable = null;
        String lower = query.toLowerCase();

        // --- Parse role: multi-level ---
        // Level 1: tìm cụm 2-word phổ biến
        String[][] rolePhrases = {
            {"senior developer", "developer"}, {"junior developer", "developer"},
            {"frontend developer", "developer"}, {"backend developer", "developer"},
            {"java developer", "developer"}, {"fullstack developer", "developer"},
            {"tech lead", "lead"}, {"team lead", "lead"},
            {"business analyst", "ba"}, {"ba", "ba"}
        };
        for (String[] phrase : rolePhrases) {
            if (lower.contains(phrase[0])) {
                role = phrase[1];
                break;
            }
        }

        // Level 2: single keywords (nếu chưa tìm thấy)
        if (role == null) {
            String[] roleKeywords = {"developer", "designer", "tester", "pm", "ba",
                    "senior", "junior", "java", "frontend", "backend", "dev",
                    "leader", "architect", "fresher"};
            for (String kw : roleKeywords) {
                if (lower.contains(kw)) {
                    role = kw;
                    break;
                }
            }
        }

        // --- Parse department ---
        if (lower.contains("fsoft") || lower.contains("q1")) department = "FSOFT-Q1";
        if (lower.contains("q2")) department = "FSOFT-Q2";
        if (lower.contains("it")) department = "IT";
        if (lower.contains("design") || lower.contains("ui") || lower.contains("ux")) department = "Design";
        if (lower.contains("hr")) department = "HR";

        // --- Parse minAvailable ---
        Pattern p = Pattern.compile("(\\d+)\\s*%");
        Matcher m = p.matcher(lower);
        if (m.find()) {
            minAvailable = Integer.parseInt(m.group(1));
        } else {
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

    private RiskContext fallbackParseRiskContext(String query) {
        String lower = query.toLowerCase();
        Integer headcount = null;
        String roleNeeded = null;

        // Parse headcount: "thêm 2 người", "cần 3 devs", "2 Java Developer"
        Pattern numPattern = Pattern.compile("(\\d+)\\s*(người|developer|dev|tester|ba|pm|senior|junior)");
        Matcher m = numPattern.matcher(lower);
        if (m.find()) {
            headcount = Integer.parseInt(m.group(1));
        }

        // Parse role từ query
        String[] roleKeywords = {"developer", "designer", "tester", "pm", "ba",
                "senior", "junior", "java", "frontend", "backend"};
        for (String kw : roleKeywords) {
            if (lower.contains(kw)) {
                roleNeeded = kw;
                break;
            }
        }

        return new RiskContext(query, headcount, roleNeeded);
    }

    // ======================== DB Query Helpers ========================

    private List<RecommendedResource> findResources(SearchCriteria criteria) {
        // Nếu có role → tìm theo role + available
        if (criteria.role != null && !criteria.role.isBlank()) {
            int minAvail = criteria.minAvailable != null ? criteria.minAvailable : 0;
            return resourceTools.findEmployees(criteria.role, criteria.department, minAvail);
        }

        // Nếu KHÔNG có role nhưng có minAvailable → tìm tất cả employee có available >= minAvailable
        if (criteria.minAvailable != null) {
            List<RecommendedResource> allAvailable = resourceTools.findEmployees(null, criteria.department, criteria.minAvailable);
            log.info("No role specified, filtering by minAvailable={} → {} results", criteria.minAvailable, allAvailable.size());
            return allAvailable;
        }

        // Không role, không minAvailable → không thể recommend
        log.warn("No criteria specified, returning empty");
        return List.of();
    }

    // ======================== Risk Logic (100% Java) ========================

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

    // ======================== Inner types ========================

    private record SearchCriteria(String role, String department, Integer minAvailable) {}
    private record RiskContext(String requestDescription, Integer requestedHeadcount, String roleNeeded) {}

    /**
     * Gemini API request body model.
     */
    private static class GeminiRequest {
        public Content[] contents;

        public GeminiRequest(String text) {
            this.contents = new Content[]{ new Content(new Part[]{ new Part(text) }) };
        }

        public record Content(Part[] parts) {}
        public record Part(String text) {}
    }
}
