export function getApiDocs() {
  return {
    openapi: "3.0.0",
    info: {
      title: "Skindit API",
      version: "1.0.0",
      description: "AI-powered skincare ingredient analysis API — 피부 타입별 성분 분석",
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
    ],
    tags: [
      { name: "Analysis", description: "AI 성분 분석" },
      { name: "OCR", description: "성분표 사진 스캔" },
      { name: "Profile", description: "피부 프로필" },
      { name: "History", description: "분석 히스토리" },
      { name: "User", description: "사용자 관리" },
    ],
    paths: {
      "/api/analyze": {
        post: {
          tags: ["Analysis"],
          summary: "성분 분석 요청",
          description: "전성분 텍스트를 AI로 분석합니다. 로그인 시 자동으로 히스토리에 저장됩니다.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyzeRequest" } } },
          },
          responses: {
            200: { description: "분석 성공" },
            429: { description: "Rate limit 초과" },
          },
        },
      },
      "/api/ocr": {
        post: {
          tags: ["OCR"],
          summary: "성분표 사진 OCR",
          description: "화장품 뒷면 성분표 사진에서 성분 텍스트를 추출합니다.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/OcrRequest" } } },
          },
          responses: {
            200: { description: "OCR 성공", content: { "application/json": { schema: { properties: { text: { type: "string" } } } } } },
            400: { description: "잘못된 이미지" },
          },
        },
      },
      "/api/profile": {
        get: {
          tags: ["Profile"],
          summary: "피부 프로필 조회",
          security: [{ sessionAuth: [] }],
          responses: {
            200: { description: "프로필 반환" },
            401: { description: "인증 필요" },
          },
        },
        put: {
          tags: ["Profile"],
          summary: "피부 프로필 저장/수정",
          security: [{ sessionAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileRequest" } } },
          },
          responses: {
            200: { description: "저장 성공" },
            401: { description: "인증 필요" },
          },
        },
      },
      "/api/history": {
        get: {
          tags: ["History"],
          summary: "분석 히스토리 조회",
          security: [{ sessionAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
            { name: "type", in: "query", schema: { type: "string", enum: ["SINGLE", "ROUTINE"] } },
          ],
          responses: {
            200: { description: "히스토리 목록", content: { "application/json": { schema: { $ref: "#/components/schemas/HistoryListResponse" } } } },
            401: { description: "인증 필요" },
          },
        },
        post: {
          tags: ["History"],
          summary: "분석 결과 저장",
          security: [{ sessionAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/HistoryCreateRequest" } } },
          },
          responses: {
            201: { description: "저장 성공" },
            401: { description: "인증 필요" },
          },
        },
      },
      "/api/history/{id}": {
        delete: {
          tags: ["History"],
          summary: "분석 기록 삭제",
          security: [{ sessionAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            204: { description: "삭제 성공" },
            403: { description: "권한 없음" },
            404: { description: "기록 없음" },
          },
        },
      },
      "/api/user": {
        get: {
          tags: ["User"],
          summary: "현재 사용자 정보",
          security: [{ sessionAuth: [] }],
          responses: { 200: { description: "사용자 정보" }, 401: { description: "인증 필요" } },
        },
        delete: {
          tags: ["User"],
          summary: "계정 삭제",
          description: "사용자 계정과 모든 관련 데이터를 삭제합니다 (Cascade).",
          security: [{ sessionAuth: [] }],
          responses: { 204: { description: "삭제 성공" }, 401: { description: "인증 필요" } },
        },
      },
    },
    components: {
      securitySchemes: {
        sessionAuth: { type: "apiKey", in: "cookie", name: "next-auth.session-token" },
      },
      schemas: {
        AnalyzeRequest: {
          type: "object",
          required: ["system", "user"],
          properties: {
            system: { type: "string", description: "시스템 프롬프트" },
            user: { type: "string", description: "사용자 입력 (성분 목록)" },
          },
        },
        OcrRequest: {
          type: "object",
          required: ["image"],
          properties: {
            image: { type: "string", description: "Base64 인코딩된 이미지 (data:image/...;base64,...)" },
          },
        },
        ProfileRequest: {
          type: "object",
          properties: {
            skinType: { type: "string", enum: ["DRY", "OILY", "COMBINATION", "SENSITIVE", "NORMAL"] },
            concerns: { type: "array", items: { type: "string" } },
            note: { type: "string" },
          },
        },
        HistoryCreateRequest: {
          type: "object",
          required: ["type", "ingredients", "score", "resultJson"],
          properties: {
            type: { type: "string", enum: ["SINGLE", "ROUTINE"] },
            ingredients: { type: "string" },
            concerns: { type: "array", items: { type: "string" } },
            score: { type: "integer" },
            resultJson: { type: "object" },
            lang: { type: "string", default: "ko" },
          },
        },
        HistoryListResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: { type: "object" } },
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
          },
        },
      },
    },
  }
}
