# AI Integration Architecture

> Tài liệu mô tả kiến trúc AI Integration, cách hoạt động, fallback strategy, và data flow.

---

## 1. Tổng Quan Kiến Trúc

### Hybrid Architecture

```
User Query (Natural Language)
        │
        ▼
┌─────────────────────────────────────────────────┐
│               Tầng 1: LLM (OpenRouter / Gemini)  │
│  • Parse NL → trích xuất tham số tìm kiếm         │
│  • AI KHÔNG tự query DB                           │
└───────────────────────┬─────────────────────────┘
        │ fail (key hết hạn, network, parse lỗi)
        ▼
┌─────────────────────────────────────────────────┐
│               Tầng 2: LLM Retry                  │
│  • Retry với prompt đơn giản hơn                 │
│  • Bỏ instruction phức tạp                       │
└───────────────────────┬─────────────────────────┘
        │ fail
        ▼
┌─────────────────────────────────────────────────┐
│               Tầng 3: Java Fallback              │
│  • Regex keyword matching                       │
│  • Không cần network / API key                  │
│  • Always available                             │
└─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│          Java DB Query (Repository)              │
│  • Query bằng Spring Data JPA                    │
│  • An toàn, chính xác, có kiểm soát             │
└───────────────────────┬─────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│               Tầng 1: LLM Explanation            │
│  • Sinh explanation tự nhiên từ kết quả          │
└───────────────────────┬─────────────────────────┘
        │ fail
        ▼
┌─────────────────────────────────────────────────┐
│          Tầng 2: Java Smart Explanation          │
│  • Tự sinh explanation từ dữ liệu DB             │
│  • Có statistics, role gợi ý                    │
└─────────────────────────────────────────────────┘
```

### Nguyên Tắc Quan Trọng

> **⚠️ AI KHÔNG tự query Database.**  
> LLM chỉ làm 2 việc: (1) parse natural language → tham số, (2) sinh explanation.  
> Query DB luôn do Java code thực hiện → an toàn, chính xác, kiểm soát được.

---

## 2. Use Case Flow: AI Resource Recommendation

### 2.1 Happy Path (LLM hoạt động)

```yaml
User: "Tìm Java Developer còn tối thiểu 50% available"

Flow:
  1. POST /api/v1/ai/recommend { query: "..." }
  
  2. extractSearchCriteriaWithFallback(query)
     ├── Tầng 1: callLLMJson() → Gemini/OpenRouter parse query
     │   Prompt: "Extract search criteria... Return JSON..."
     │   Response: {"role": "Developer", "department": null, "minAvailable": 50}
     │
     └── Nếu valid → dùng luôn, skip tầng 2,3
  
  3. findResources(criteria)
     ├── criteria = {role: "Developer", minAvailable: 50}
     ├── maxAllocation = 100 - 50 = 50
     ├── Query: SELECT * FROM employee WHERE role LIKE '%Developer%'
     │         AND (allocation <= 50 OR chưa allocate)
     │
     └── Kết quả: [] (vì không ai có allocation ≤ 50%)
  
  4. generateSmartExplanation(query, criteria, [])
     ├── Tầng 1: callLLM() → "Không tìm thấy..."
     └── Fallback → tự sinh từ criteria
  
  5. buildEmptyResultHint(criteria)
     ├── Đếm employee theo role
     ├── Gợi ý role có sẵn trong hệ thống
     └── Gợi ý giảm % available
  
  6. Response: AiRecommendationResponse
```

### 2.2 LLM Fail Path (AI không hoạt động)

```yaml
Khi LLM gặp lỗi (key expire, network, rate limit, JSON parse fail):

extractSearchCriteriaWithFallback(query)
  ├── Tầng 1: callLLMJson() → null
  │     └── Log: "LLM criteria parsing failed, using Java regex fallback"
  │
  └── Tầng 3: fallbackParse(query)
        ├── Multi-level keyword matching:
        │   Level 1 - 2-word phrases: "java developer" → "developer" ✅
        │   Level 2 - single keywords: "developer", "tester", "java"...
        │
        ├── Department parsing: "fsoft" → FSOFT-Q1
        │
        └── Pattern: (\\d+)\\s*% → "50%" → minAvailable=50

→ Kết quả giống hệt happy path nhưng không cần AI
```

### 2.3 Explanation Fallback Flow

```yaml
generateSmartExplanation()
  ├── Tầng 1: callLLM()
  │     Prompt: "Explain these search results in Vietnamese..."
  │     → Nếu có response → dùng luôn
  │
  └── Tầng 2: Java Hardcoded Smart
        ├── Nếu resources empty:
        │   "Không tìm thấy resource phù hợp. Yêu cầu role: 'Developer'.
        │    Yêu cầu available tối thiểu: 50%. Thử giảm yêu cầu..."
        │
        └── Nếu có resources:
              "Dựa trên yêu cầu, tôi tìm thấy N resource phù hợp:
               • Tên — Role (Dept) — available: X%
               • Dự án hiện tại: ..."
```

---

## 3. Use Case Flow: AI Risk Analysis

### 3.1 Happy Path

```yaml
User: "Sprint tới cần thêm 2 Java Developer"

Flow:
  1. POST /api/v1/ai/risk-analysis { query: "..." }
  
  2. extractRiskContextWithFallback(query)
     ├── LLM parse → {requestDescription, requestedHeadcount, roleNeeded}
     └── Fallback → Java regex: "thêm 2 người" → headcount=2
  
  3. Java query DB (luôn chạy, không phụ thuộc AI):
     ├── overloaded = getOverloadedResources()
     ├── available = getAvailableResources()
     ├── totalAllocated = countDistinctAllocatedEmployees()
     └── totalEmployees = count()
  
  4. calculateRiskItems(overloaded, available, ...)
     ├── Risk 1: OVERLOAD (nếu có người >90%)
     ├── Risk 2: CAPACITY (nếu utilization >80%)
     ├── Risk 3: AVAILABILITY (nếu <3 người có quỹ thời gian)
     └── Luôn chạy bằng Java, không cần AI
  
  5. generateRiskAssessmentWithFallback()
     ├── Tầng 1: callLLM() → phân tích risk bằng AI
     └── Tầng 2: buildJavaRiskAssessment()
           └── Tự tính: "X/Y employees allocated (Z%).
               A overloaded. B người còn >50% quỹ thời gian.
               Yêu cầu thêm N người KHÔNG khả thi..."
  
  6. Response: RiskAnalysisResponse
```

### 3.2 Risk Assessment Fallback

```yaml
buildJavaRiskAssessment() — không cần AI:
  Input: overloaded, available, totalAllocated, totalEmployees, riskContext
  
  Logic:
  ├── utilizationRate = totalAllocated / totalEmployees * 100
  ├── trulyAvailable = available.filter(a.allocation < 50).count()
  │
  ├── "Đánh giá capacity hiện tại:"
  ├── "- X/Y employees allocated (Z%)."
  ├── "- N employees overloaded (>90%)."
  ├── "- M người còn >50% quỹ thời gian."
  │
  └── Nếu có requestedHeadcount:
        ├── Nếu trulyAvailable >= headcount:
        │   "Yêu cầu thêm N người KHẢ THI..."
        └── Nếu không:
              "Yêu cầu thêm N người KHÔNG khả thi..."
```

---

## 4. 3-Tầng Fallback Strategy (Chi Tiết)

### Tầng 1: LLM (OpenRouter / Gemini)

```yaml
Provider: OpenRouter (nếu key prefix "sk-or-") hoặc Google Gemini (key prefix "AIza...")
Model: Configurable qua env AI_MODEL (mặc định: google/gemma-4-31b:free)

Cách gọi:
  ├── OpenRouter: POST https://openrouter.ai/api/v1/chat/completions
  │   Headers: Authorization: Bearer {key}
  │   Body: { model, messages: [{role, content}], temperature: 0.2 }
  │
  └── Gemini: POST .../generateContent?key={key}
      Body: { contents: [{ parts: [{ text }] }] }

Lỗi thường gặp:
  ├── 401: Key sai hoặc hết hạn
  ├── 402: Hết credit (OpenRouter)
  ├── 429: Rate limit
  ├── 503: Model overloaded
  └── JSON parse error: LLM trả về text thay vì JSON
```

### Tầng 2: LLM Retry

```yaml
Khi tầng 1 thất bại (response empty):
  1. Retry với prompt đơn giản hơn (bỏ instruction phức tạp)
  2. Retry với prompt rút gọn (cắt bớt nếu >1000 ký tự)
  
Mục đích: Một số model miễn phí (free tier) bị giới hạn context length
hoặc không handle được instruction phức tạp → prompt đơn giản thường hoạt động.
```

### Tầng 3: Java Fallback (100% không cần AI)

```yaml
Khi tất cả LLM attempts thất bại → Java tự xử lý:

Recommend:
  ├── fallbackParse()
  │   ├── Multi-level keyword matching (2-word phrases → single keyword)
  │   ├── Department keyword matching
  │   └── Regex number extraction (50% → 50, "20 percent" → 20)
  │
  ├── generateSmartExplanation()
  │   └── Tự sinh explanation từ dữ liệu + statistics
  │
  └── buildEmptyResultHint()
      └── Tra DB để gợi ý role khả dụng

Risk Analysis:
  ├── fallbackParseRiskContext()
  │   ├── Regex: (\\d+)\\s*(người|developer|...) → headcount
  │   └── Keyword matching → roleNeeded
  │
  ├── calculateRiskItems() — luôn là Java (không phụ thuộc AI)
  ├── calculateSuggestions() — luôn là Java
  └── buildJavaRiskAssessment() — tự đánh giá từ số liệu thực
```

---

## 5. API Endpoints

### `POST /api/v1/ai/recommend`

```json
// Request
{ "query": "Tìm Java Developer còn tối thiểu 50% available" }

// Success Response (200)
{
  "query": "string",
  "explanation": "Giải thích bằng ngôn ngữ tự nhiên",
  "recommendedResources": [
    {
      "employeeId": 1,
      "employeeName": "Nguyen Van A",
      "role": "Senior Developer",
      "department": "FSOFT-Q1",
      "email": "a@company.com",
      "available": 60,
      "currentProjects": ["NCG Platform", "Grid System"]
    }
  ],
  "warnings": ["Gợi ý khi không tìm thấy"]
}

// Error Response (500 — all fallbacks failed)
{
  "success": false,
  "message": "Internal server error. Please contact support.",
  "errorCode": "INTERNAL_ERROR",
  "status": 500
}
```

### `POST /api/v1/ai/risk-analysis`

```json
// Request
{ "query": "Sprint tới cần thêm 2 Java Developer" }

// Response (200)
{
  "query": "string",
  "overallAssessment": "Đánh giá bằng ngôn ngữ tự nhiên",
  "risks": [
    {
      "type": "OVERLOAD | CAPACITY | AVAILABILITY",
      "description": "Mô tả risk",
      "severity": "HIGH | MEDIUM | LOW",
      "impact": "Mô tả tác động"
    }
  ],
  "suggestions": ["Đề xuất hành động"]
}
```

---

## 6. Configuration

### Environment Variables

| Variable | Required | Default | Mô tả |
|----------|----------|---------|-------|
| `GEMINI_API_KEY` | ✅ Yes | — | API key. OpenRouter prefix `sk-or-`, Gemini prefix `AIza-` |
| `AI_MODEL` | ❌ No | `google/gemma-4-31b:free` | Model name (chỉ dùng cho OpenRouter) |

### Các model OpenRouter phổ biến (free)

| Model | OpenRouter ID | Ghi chú |
|-------|--------------|---------|
| Gemma 4 31B (free) | `google/gemma-4-31b:free` | ✅ Default, ổn định |
| GPT-4o-mini | `openai/gpt-4o-mini` | Cần có credit |
| Claude 3 Haiku | `anthropic/claude-3-haiku` | Cần có credit |
| Gemini 2.0 Flash | `google/gemini-2.0-flash` | Cần có credit |

---

## 7. Error Handling

| Tình huống | FE nhận được | Cause |
|-----------|--------------|-------|
| AI hoạt động, DB có data | 200 + resources | ✅ Happy path |
| AI hoạt động, DB empty | 200 + empty resources | Đúng business logic |
| AI fail, Java fallback work | 200 + resources | Fallback thành công |
| AI fail, Java parse sai | 200 + empty resources | Fallback cũng không parse được |
| DB connection error | 500 | Database down |
| Unhandled exception | 500 + INTERNAL_ERROR | Bug cần debug |
| API key sai/hết hạn | 200 (fallback) | Silent fallback, không crash |

> **Không có trường hợp nào gây mất trắng (blank page)** — 3 tầng fallback đảm bảo luôn có response.

---

## 8. Logging & Debug

### Log levels

| Level | Khi nào | Ví dụ |
|-------|---------|-------|
| `INFO` | Request đến | `AI recommend request: "Tìm Java..."` |
| `INFO` | Provider được chọn | `Using OpenRouter AI provider, model: ...` |
| `WARN` | LLM call fail | `LLM call attempt failed: 401 Unauthorized` |
| `WARN` | Fallback được dùng | `LLM criteria parsing failed, using Java regex fallback` |
| `ERROR` | Unexpected | `Unexpected error: ...` (GlobalExceptionHandler) |

### Debug pattern

```bash
# Xem log AI
docker compose logs be | grep -E "ai\.|LLM|fallback|Gemini|OpenRouter"

# Xem chi tiết request
docker compose logs be | grep "AI recommend"
```
