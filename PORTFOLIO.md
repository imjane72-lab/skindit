# skindit - AI 피부 타입별 성분 분석 서비스

> **"AI와 협업하여 비즈니스 가치를 극대화하는, '실행력 있는' 풀스택 개발자 김지혜입니다."**

> 단순히 코드를 짜는 것을 넘어, AI 에이전트와 RAG 패턴을 활용해 복잡한 도메인 문제를 해결하고 사용자에게 실질적인 도움을 주는 서비스를 만듭니다.

[🚀 서비스 바로가기 →](https://skindit-web.vercel.app)   [📂 GitHub 코드 보기 →](https://github.com/imjane72-lab/skindit)

---

## 핵심 역량 요약

| 역량 | 내용 |
|------|------|
| **AI-Native Development** | Claude Code CLI를 활용한 아키텍처 설계 및 개발 공수 **48% 단축** 경험 |
| **Data-Driven Reliability** | 식약처 API + 자체 DB를 결합한 Agentic RAG 패턴으로 AI Hallucination 문제 해결 |
| **Full-Stack Ownership** | Next.js 16, Prisma, PostgreSQL 기반 확장 가능한 백엔드 설계부터 Vercel 배포까지 End-to-End 개발 |

---

## 1. 프로젝트 핵심 요약

> "사진 한 장으로 내 피부에 맞는 성분을 찾고, 같이 쓰면 안 되는 제품 조합을 미리 확인하세요."

**배경**: 기존 성분 분석 서비스(화해 등)가 놓치고 있는 **'개인화(Personalization)'** 와 **'성분 간 궁합(Interaction)'** 문제를 해결하기 위해 기획했습니다.

- 식약처 2만 개 데이터 기반 RAG 패턴 적용으로 AI 답변 신뢰도 확보
- AI 도구(Claude Code) 활용으로 개발 생산성 48% 향상
- 15개 트러블슈팅 해결로 프로덕션 수준 배포 안정화

| 항목 | 내용 |
|------|------|
| 개발 기간 | 2026.03 |
| 개발 인원 | 1인 (기획 / 디자인 / FE / BE) |
| 태그 | #Full-stack #Next.js16 #AI-Native #RAG #1인개발 |
| 총 커밋 | 78개 |

---

## 2. 기술 스택

### Frontend
| 기술 | 버전 | 선택 이유 |
|------|------|-----------|
| Next.js | 16.1 | App Router + Server Components, Turbopack 빌드 성능 |
| React | 19.2 | Concurrent Features, Suspense 활용 |
| TypeScript | 5.9 | 13개 인터페이스로 AI API 응답 타입 완전 관리 |
| Tailwind CSS | 4.1 | Utility-first, 빠른 UI 반복 개발 |

### Backend
| 기술 | 버전 | 선택 이유 |
|------|------|-----------|
| Next.js API Routes | 16.1 | 풀스택 단일 프레임워크, 16개 엔드포인트 |
| Prisma | 6.x | Type-safe ORM, 자동 마이그레이션, NextAuth 어댑터 |
| PostgreSQL | 16 | 관계형 데이터 (유저-프로필-분석기록-일지) |
| NextAuth | v5 beta | Database 세션 전략, Google/Kakao OAuth2 |

### AI & Data — Agentic RAG 패턴
| 기술 | 용도 |
|------|------|
| Claude Haiku 4.5 | 성분 분석, 채팅 상담, 리포트 생성 (분석 1회 ~15~25원) |
| 자체 성분 DB | 주요 28개 성분의 검증된 과학 데이터를 AI 프롬프트에 직접 주입 |
| 식약처 MFDS API | 2만 개+ 화장품 원료성분 공공데이터 실시간 검증 |

> **RAG 고도화 전략 4가지:**
> 1. **하이브리드 검색** — 자체 DB(키워드 매칭) + MFDS API(공공데이터)를 병렬 조회
> 2. **가드레일(Guardrails)** — "컨텍스트에 없는 내용은 출력 차단" 규칙 적용
> 3. **출처 표기(Citation)** — "식약처 등록 성분이에요" 등 출처 명시로 신뢰도 향상
> 4. **No-Answer 전략** — 데이터에 없으면 추측 대신 "피부과 전문의와 상담해보세요"

### Infra & DevOps
| 기술 | 용도 |
|------|------|
| Vercel | 배포 + CDN + Edge Functions (서울 리전) |
| AWS RDS | PostgreSQL 16 (서울 리전 ap-northeast-2) |
| Turborepo | 모노레포 빌드 캐싱 + 병렬 실행 |
| pnpm | 워크스페이스 기반 패키지 관리 |

---

## 3. 시스템 아키텍처

> **"효율성과 확장성을 고려한 3-Tier 풀스택 아키텍처 설계"**
> - **Next.js 16 App Router 기반**: 서버 컴포넌트(RSC)를 활용해 초기 로딩 속도를 최적화하고, API Routes를 통해 FE/BE 타입을 긴밀하게 공유
> - **Agentic RAG 워커 구현**: AI Hallucination 방지를 위해 식약처 공공데이터와 자체 성분 DB를 병렬 조회하여 컨텍스트를 주입하는 전용 API 파이프라인 구축
> - **보안 강화 미들웨어**: Edge Middleware 단에서 Rate Limit과 Bot 차단 로직을 구현하여 인프라 비용 및 보안 위협 관리

```
+---------------------------------------------------------------+
| TIER 1  Client Layer  (Next.js 16 App Router)                 |
|                                                               |
|  /page(분석)  /chat(채팅)  /diary(일지)  /hist(기록)          |
|  /profile(프로필)  /pricing(요금제)  /admin(관리자)           |
+-----------------------------+---------------------------------+
                              |  HTTP Request
                              v
+---------------------------------------------------------------+
| TIER 2  API & Logic Layer  (Next.js API Routes)               |
|                                                               |
|  middleware.ts                                                |
|  +-- Bot Blocking -> Rate Limit -> CORS -> Security Headers   |
|                              |                                |
|  /api/analyze ------------>  [     RAG Pipeline     ]         |
|    user input    +------->   self ingredient DB  (parallel)   |
|    skin profile  +------->   MFDS public API     (parallel)   |
|                                        |                      |
|                              [  Claude Haiku  ] <-------+     |
|                                        | JSON response  |     |
|  /api/ocr    -> Claude Haiku Vision (OCR) -------------+      |
|  /api/chat   -> Claude Haiku (dermatologist persona)          |
|  /api/report -> Claude Haiku (monthly report)                 |
|  /api/profile  /api/diary  /api/history                       |
|  /api/user     /api/credits  /api/admin/stats                 |
+-----------------------------+---------------------------------+
                              |  Prisma ORM (Type-safe)
                              v
+---------------------------------------------------------------+
| TIER 3  Data & Infra Layer                                    |
|                                                               |
|  PostgreSQL 16  AWS RDS  Seoul (ap-northeast-2)               |
|  +-- 9 Models: User, SkinProfile, AnalysisHistory             |
|               SkinDiary, CreditBalance, CreditTransaction     |
|               ChatMessage, Account, Session                   |
|                                                               |
|  Vercel  Seoul Region  Edge Functions  CDN                    |
|  Turborepo  Monorepo Build Cache + Parallel Execution         |
+---------------------------------------------------------------+
```

---

## 4. 데이터 모델링 (ERD)

```
User (1) ──── (1) SkinProfile        # 피부 타입, 고민, 메모
  │
  ├──── (*) AnalysisHistory          # 분석 결과 JSON, 점수, 성분 목록
  ├──── (*) SkinDiary                # 일일 피부 상태, 제품, 트러블, 식단
  ├──── (*) ChatMessage              # AI 상담 대화 기록
  ├──── (*) CreditTransaction        # 크레딧 사용/충전 이력
  ├──── (1) CreditBalance            # 현재 크레딧 잔액
  ├──── (*) Account                  # OAuth 계정 (Google, Kakao)
  └──── (*) Session                  # 활성 세션
```

**설계 포인트:**
- `AnalysisHistory.resultJson` — JSON 컬럼으로 저장해 스키마 변경 없이 결과 형식 확장 가능
- `SkinDiary` 인덱스 `(userId, date DESC)` — 월별 일지 조회 시 효율적 정렬
- `CreditTransaction.type` (charge/analysis/chat/report) — 크레딧 사용처 추적
- `User.role` (user/admin) — 역할 기반 접근 제어, 어드민 API 분리

---

## 5. 핵심 기능 & AI 파이프라인

### AI 성분 분석 — RAG 파이프라인

**3가지 분석 모드:**
- **단일 제품** — 전성분 → 점수(0~100) + 고민별 분석 + 추천/주의 성분
- **루틴 궁합** — 2개 이상 제품 → 충돌 감지 + 시너지 + 최적 사용 순서
- **성분 비교** — A vs B → 공통/고유 성분 + 피부 타입별 추천

```
1. user input (text / OCR photo)
        |
2. self ingredient DB query ----+  (parallel)
3. MFDS public API query -------+
        |
4. prompt assembly (skin type + verified data + AI instruction)
        |
5. Claude Haiku API call (max 3 auto-retries)
        |
6. JSON parse + truncated response recovery + render
```

### 사진 OCR (다국어 지원)
Claude Vision API로 전성분표 사진을 텍스트 추출. `lang` 파라미터로 한국어/영어 모드 분기.

### AI 피부 상담 채팅
피부과 경력 30년 여의사 페르소나. 핵심 2~4문장, 역질문 없이 즉시 답변. 피부 프로필 자동 반영.

### 피부 일지 & AI 월간 리포트
매일 피부 상태/제품/트러블/식단 기록 → 5일+ 누적 시 AI가 패턴 분석 후 월간 리포트 생성.

---

## 6. AI-Native 개발 역량 (Claude Code 활용)

| 영역 | AI 활용 방식 | 결과 |
|------|-------------|------|
| 컴포넌트화 | 3,211줄 파일의 의존성 분석 후 자동 추출 | **48% 코드 감소** |
| 프롬프트 엔지니어링 | 분석 프롬프트 22줄 → 3줄로 압축, 정확도 유지 | **응답 2~3초 단축** |
| 트러블슈팅 | Vercel+RDS 연결, Prisma 캐시 등 15개 이슈 해결 | **배포 안정화** |
| DB 설계 | 9개 모델의 관계 설계 + 마이그레이션 자동화 | **Type-safe CRUD** |

**AI가 제안한 코드를 검증/수정한 사례:**
- AI가 "식약처 미등록 성분"이라고 잘못 생성 → 실제 API 호출로 검증 후 프롬프트 규칙 강화
- AI가 PDRN 수용체를 A1으로 잘못 설명 → 논문 확인 후 A2A로 수정, 자체 성분 DB 구축
- AI가 배럴 파일(index.ts)을 제안 → Next.js 트리쉐이킹 이슈 확인 후 직접 경로 import로 변경

> **교훈**: AI 도구는 생성한 코드를 무조건 신뢰하면 안 된다. 특히 도메인 지식(의학/화학)이 필요한 영역에서는 AI 제안 → 검증 → 수정 프로세스가 필수다.

---

## 7. 트러블슈팅

### TOP 3 핵심 이슈

**① Vercel 서버리스 → AWS RDS 연결 실패** `#인프라` `#배포`

- **Situation** — Vercel 배포 후 DB 연결이 전혀 안 되는 상황 발생. 처음엔 환경변수 문제로 오해해 시간 낭비.
- **Task** — `Can't reach database server` 에러 메시지를 보고서야 네트워크 레벨 문제임을 파악.
- **Action** — Vercel 서버리스는 요청마다 IP가 유동적이라 고정 IP 화이트리스트 불가능함을 이해. RDS 보안그룹을 `0.0.0.0/0`으로 오픈하되, **DB 비밀번호를 32자리 이상 무작위 문자열로 설정**하고, **Prisma 연결 시 SSL 인증서를 강제 적용**하여 전송 중인 데이터를 암호화함으로써 네트워크 보안 공백을 메웠습니다.
- **Result** — 배포 성공. 서버리스 환경에서는 IP 기반 접근 제어가 무의미하며, **인증 기반 보안(강력한 비밀번호 + SSL 암호화)으로 대체**해야 한다는 인프라 설계 원칙 체득.

**② AI Hallucination — RAG 패턴으로 해결** `#AI` `#신뢰도`

- **Situation** — PDRN 수용체를 A1(실제 A2A)으로 오기재, 비타민C+PDRN을 "금지 콤보"로 잘못 분류, 식약처 등록 성분을 "미등록"으로 단정하는 Hallucination 빈발.
- **Task** — 건강과 직결된 서비스에서 잘못된 정보는 치명적. 근본적 해결책이 필요.
- **Action** — 3단계 접근: ① 주요 28개 성분 과학 데이터를 `ingredient-db.ts`에 하드코딩 → 프롬프트 직접 주입(RAG), ② MFDS에서 못 찾은 성분은 "데이터 없음"으로 처리 및 언급 차단, ③ 모든 프롬프트에 "데이터에 있는 것만 언급, 추측 금지" 규칙 추가.
- **Result** — 잘못된 성분 정보 생성 대폭 감소. **"지어내지 마"보다 "이 데이터만 써"가 100배 효과적**임을 체득.

**③ Claude 응답 JSON 파싱 실패 — 방어적 파싱 구현** `#AI` `#안정성`

- **Situation** — 피부 고민 5개 이상 + 성분 20개+ 분석 시 `max_tokens: 2048` 한도 초과로 JSON이 중간에 잘려 `JSON.parse()` 실패 → 사용자에게 오류 화면 노출.
- **Task** — AI 분석이 핵심 기능인 서비스에서 이 UX는 허용 불가.
- **Action** — 3단계 복구 전략: 정상 파싱 시도 → 잘린 JSON에 닫는 괄호 추가 후 재파싱 → 재시도. `max_tokens` 2048 → 3200으로 증량.
- **Result** — 사용자는 로딩이 약간 길어질 뿐 오류 화면 거의 미노출.

### 그 외 해결한 12가지 이슈

- **Turborepo 환경변수 빌드 미전달** — `turbo.json` `env` 배열 미등록 시 빌드에 전혀 전달 안 됨. 전체 환경변수 명시적 등록으로 해결.
- **모노레포 전환 후 빌드 완전 불가** — dependsOn 충돌 + 공유 패키지 exports 누락 + pnpm workspace 버전 충돌 3가지 동시 발생. 태스크 분리 + exports 필드 추가로 해결.
- **PrismaClient is not defined** — Vercel이 캐시된 node_modules 사용 → `prisma generate` 미실행. 빌드 커맨드에 `prisma generate && next build` 추가.
- **Anthropic API 간헐적 500 에러** — 최대 3회 재시도 + 지수 백오프(1.5초, 3초) 구현. 사용자 오류 노출 최소화.
- **page.tsx 3,211줄 → 1,667줄** — 4단계 컴포넌트 분리로 48% 감소. 직접 import로 트리쉐이킹 최적화.
- **OCR이 영어로만 반환** — OCR 프롬프트 언어 분기 + `lang` 파라미터로 한국어/영어 모드 처리.
- **모바일 키보드에 채팅 입력창 이탈** — `position: absolute` → `sticky` + `safe-area-inset-bottom` 적용.
- **제품명 자동 검색 기능 폐기** — Puppeteer 정확도 부족 + Cold Start 5~10초. 부정확한 기능은 없는 것보다 나쁘다 판단, 전체 폐기 후 OCR + 직접 입력으로 대체.
- **Suspense 경계 누락 빌드 에러** — `useSearchParams()` Suspense 래핑 필수. 로컬 dev는 정상, 빌드에서만 터지는 함정.
- **공유 URL 딥링크 미작동** — 모든 공유가 메인으로 연결. `?tab=single|routine` 파라미터로 해결.
- **로그인 후 입력 컨텍스트 유실** — `callbackUrl` 탭 파라미터 + `sessionStorage` 입력 데이터 보존으로 해결.
- **피부 고민 결과 누락** — JSON 스키마 `max 4` 제한 삭제 + "선택한 고민 전부 포함" 명시.

---

## 8. 성능 최적화

> 총 응답 속도 3~5초 단축 달성

| 최적화 항목 | 방법 | 결과 |
|------------|------|------|
| API 호출 병렬화 | MFDS API + AI 분석 순차 → 병렬 실행 | **1~2초 단축** |
| 프롬프트 압축 | ~22줄 → 3줄 (60% 압축) + MFDS 2초 타임아웃 | **2~3초 단축** |
| 자체 성분 DB 캐싱 | 트렌딩 성분 8개 로컬 즉시 반환 | **API 호출 0회** |
| 컴포넌트 분리 | 3,211줄 → 1,667줄, 14개 파일 분리 | **번들 최적화** |

---

## 9. 보안

| 보안 항목 | 구현 |
|-----------|------|
| 인증 | NextAuth v5 Database 세션, Google/Kakao OAuth2 |
| API Rate Limit | IP당 5회/분, 50회/일 (in-memory Map) |
| Bot 차단 | User-Agent 패턴 매칭 (bot, crawler, curl 등) |
| CORS | 허용 오리진 화이트리스트 |
| 보안 헤더 | X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| 역할 기반 접근 | admin/user 역할 분리, 어드민 API 별도 인증 |

---

## 10. 배운 점

1. **RAG 고도화** — 하이브리드 검색 + 가드레일 + 출처 표기 + No-Answer 전략 4가지 조합이 핵심이다.
2. **AI 도구와의 협업** — AI 제안 코드는 검증 필수. 도메인 지식 영역은 AI 제안 → 검증 → 수정 프로세스가 필수.
3. **비용 vs 정확도** — Claude Haiku + 자체 성분 DB 조합으로 분석 1회 ~25원에 높은 정확도 달성.
4. **모바일 우선 UX** — sticky, safe-area-inset, 딥링크, 로그인 컨텍스트 보존 등 모바일 실전 이슈 해결.
5. **"빼는" 제품 결정** — 정확도 없는 기능은 없는 것보다 나쁘다. 기능을 빼는 것도 중요한 제품 결정.
6. **서버리스 인프라 이해** — Turborepo 환경변수 함정, Vercel IP 유동성, Prisma 캐시 문제 등 체득.

---

## 11. 향후 계획

- [x] AI 성분 분석 + OCR + 채팅 + 피부 일지 구현
- [x] Google / Kakao OAuth 배포
- [x] 트러블 원인 / 시술 추천 / 피부과 방문 리포트 무료 전환
- [x] 프롬프트 60% 압축, 응답 속도 2~3초 단축
- [ ] Toss Payments 결제 연동 (크레딧 API 구현 완료)
- [ ] 대안 제품 추천 기능
- [ ] GitHub Actions CI/CD 파이프라인 구축
- [ ] 에러 모니터링 (Sentry 연동)
- [ ] 성분 트렌드 해설 콘텐츠
