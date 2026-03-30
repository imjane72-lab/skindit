# skindit - AI 피부 타입별 성분 분석 서비스

> 2만 개+ 성분 데이터 기반, 사진 한 장으로 성분 해석부터 조합 경고까지

**배포 URL**: https://skindit-web.vercel.app
**GitHub**: https://github.com/imjane72-lab/skindit
**개발 기간**: 2026.03
**개발 인원**: 1인 (기획 / 디자인 / 프론트엔드 / 백엔드)

---

## 1. 프로젝트 소개

skindit은 화장품 전성분을 AI로 분석하여 **내 피부 타입에 맞는 성분 해석, 조합 경고, 루틴 추천**을 제공하는 서비스입니다.

### 왜 만들었나?

- 화장품 뒷면 전성분표를 봐도 뭐가 좋고 나쁜지 모르는 사용자가 대다수
- 기존 성분 분석 앱(화해 등)은 성분 하나하나의 등급만 보여주고, **내 피부 타입에 맞는 해석**은 해주지 않음
- "이 두 제품 같이 써도 되나?" 같은 **조합 궁합** 질문에 답해주는 서비스가 없음

### 핵심 차별점

1. **피부 타입 맞춤 분석** - 사용자 프로필(피부 타입, 고민)을 반영한 개인화 분석
2. **조합 경고** - 같이 쓰면 안 되는 성분 콤보 자동 감지
3. **사진 OCR** - 전성분표 사진 한 장으로 자동 텍스트 추출
4. **식약처 데이터 연동** - 2만 개++ 성분 공공데이터 기반 검증

---

## 2. 기술 스택

### Frontend

| 기술             | 버전 | 선택 이유                                           |
| ---------------- | ---- | --------------------------------------------------- |
| **Next.js**      | 16.1 | App Router + Server Components, Turbopack 빌드 성능 |
| **React**        | 19.2 | Concurrent Features, Suspense 활용                  |
| **TypeScript**   | 5.9  | 타입 안전성, 13개 인터페이스로 API 응답 타입 관리   |
| **Tailwind CSS** | 4.1  | Utility-first, 빠른 UI 반복 개발                    |

### Backend

| 기술                   | 버전    | 선택 이유                                         |
| ---------------------- | ------- | ------------------------------------------------- |
| **Next.js API Routes** | 16.1    | 풀스택 단일 프레임워크, 16개 엔드포인트           |
| **Prisma**             | 6.x     | Type-safe ORM, 자동 마이그레이션, NextAuth 어댑터 |
| **PostgreSQL**         | 16      | 관계형 데이터 (유저-프로필-분석기록-일지)         |
| **NextAuth**           | v5 beta | Database 세션 전략, Google/Kakao OAuth2           |

### AI & Data

| 기술                 | 용도                                                |
| -------------------- | --------------------------------------------------- |
| **Claude Haiku 4.5** | 성분 분석, 채팅 상담, 리포트 생성 (비용 효율적)     |
| **식약처 MFDS API**  | 2만 개++ 화장품 원료성분 공공데이터 검증            |
| **자체 성분 DB**     | 주요 30개 성분 과학적 데이터 (프롬프트 정확도 향상) |

### Infra & DevOps

| 기술          | 용도                                |
| ------------- | ----------------------------------- |
| **Vercel**    | 배포 + CDN + 서버리스 함수          |
| **AWS RDS**   | PostgreSQL 데이터베이스 (서울 리전) |
| **Turborepo** | 모노레포 빌드 최적화                |
| **pnpm**      | 빠른 패키지 매니저                  |

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
│                Next.js 16 (App Router)                  │
│                                                         │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐     │
│  │ 분석 │ 채팅 │ 일지 │ 기록 │프로필│요금제│관리자│     │
│  │page/ │chat/ │diary/│hist/ │prof/ │price/│admin/│     │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘     │
│                                                         │
│  components/        types/          constants/           │
│  ├── ui/            analysis.ts     skin-data.ts        │
│  └── analysis/                                          │
└──────────────────────────┬──────────────────────────────┘
                           │ API Routes (16개)
┌──────────────────────────▼──────────────────────────────┐
│                      Backend                            │
│                Next.js API Routes                       │
│                                                         │
│  /api/analyze ── Claude Haiku ◄── MFDS API (식약처)     │
│  /api/ocr ────── Claude Haiku (Vision, 다국어 OCR)      │
│  /api/chat ───── Claude Haiku (피부과 의사 페르소나)    │
│  /api/report ─── Claude Haiku (월간 리포트 생성)        │
│  /api/profile    /api/diary     /api/history            │
│  /api/user       /api/credits   /api/admin/stats        │
│                                                         │
│  middleware.ts: Bot차단 + CORS + Rate Limit + 보안 헤더 │
└──────────────────────────┬──────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────┐
│                 PostgreSQL (AWS RDS)                     │
│  9개 모델: User, SkinProfile, AnalysisHistory,          │
│  SkinDiary, CreditBalance, CreditTransaction,           │
│  ChatMessage, Account, Session                          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 주요 기능 상세

### 4-1. AI 성분 분석 (핵심 기능)

**3가지 분석 모드:**

- **단일 제품**: 전성분 → 점수(0-100) + 고민별 분석 + 추천/주의 성분 + 안전도 차트
- **루틴 궁합**: 2개 이상 제품 → 충돌 감지 + 시너지 분석 + 최적 사용 순서
- **성분 비교**: A vs B 제품 → 공통/고유 성분 + 어떤 피부에 뭐가 맞는지

**분석 파이프라인:**

```
사용자 입력 (텍스트/OCR)
    ↓
자체 성분 DB 조회 (lib/ingredient-db.ts)
    ↓ (병렬 실행)
MFDS 식약처 API 조회 (lib/mfds-api.ts)
    ↓
프롬프트 조합 (사용자 피부타입 + 성분 데이터 + AI 지시)
    ↓
Claude Haiku API 호출 (최대 3회 자동 재시도)
    ↓
JSON 파싱 + 점수 정규화 + 결과 렌더링
```

### 4-2. 사진 OCR

화장품 전성분표 사진을 촬영하면 Claude Vision API로 텍스트를 추출합니다.

- **한국어 모드**: 한글 전성분 → 한글로 반환 (영어 성분도 한글 번역)
- **영어 모드**: 한국 전성분 → 영어로 번역 반환

### 4-3. AI 피부 상담 (채팅)

피부과 경력 30년차 여의사 페르소나로, 성분 추천 / 시술 상담 / 루틴 조언을 제공합니다.

- 핵심 2-4문장 답변 (질질 끌지 않음)
- 사용자 피부 프로필 자동 반영
- 첫 대화에서만 추가 정보 요청, 이후 바로 답변

### 4-4. 피부 일지 & 리포트

매일 피부 상태(좋음/보통/나쁨), 사용 제품, 트러블, 식단을 기록하면 5일 이상 데이터가 쌓였을 때 AI가 월간 리포트를 생성합니다.

### 4-5. 크레딧 시스템

| 기능          | 무료 (일일) | 프로 (크레딧) |
| ------------- | ----------- | ------------- |
| 성분 분석     | 3회         | 1크레딧/회    |
| AI 상담       | 10회        | 1크레딧/회    |
| 트러블 리포트 | X           | 10크레딧      |
| 시술 추천     | X           | 10크레딧      |

---

## 5. 프로젝트 구조

```
apps/web/
├── app/                          # 페이지 라우트 (8개 페이지)
│   ├── page.tsx                    # 메인 (1,667줄)
│   ├── chat/page.tsx               # AI 상담
│   ├── diary/                      # 피부 일지
│   ├── history/page.tsx            # 분석 기록
│   ├── profile/page.tsx            # 피부 프로필
│   ├── pricing/page.tsx            # 요금제
│   ├── admin/page.tsx              # 관리자
│   └── api/                        # 16개 API 엔드포인트
├── components/
│   ├── ui/                         # 범용 UI (Md, Counter, ScoreRing, ErrState)
│   └── analysis/                   # 분석 결과 (SingleResult, RoutineResult, CompareResult 등 8개)
├── lib/                            # 유틸리티
│   ├── api.ts                        # AI API 호출 + 재시도 로직
│   ├── ingredient-db.ts              # 자체 성분 데이터베이스
│   ├── mfds-api.ts                   # 식약처 공공데이터 API
│   ├── auth.ts                       # NextAuth 설정
│   └── score-utils.ts                # 점수 계산 유틸
├── types/analysis.ts               # 13개 TypeScript 인터페이스
├── constants/skin-data.ts          # 피부 고민, 트렌딩 성분 데이터
└── prisma/schema.prisma            # DB 스키마 (9개 모델)
```

**코드 규모:**

- TypeScript/TSX 파일: 57개
- 컴포넌트: 14개 (ui 4개 + analysis 8개 + providers 2개)
- API 라우트: 16개
- DB 모델: 9개
- 총 커밋: 61개

---

## 6. 트러블슈팅

### 6-1. Vercel 배포 시 DB 연결 실패

**문제**: Vercel 서버리스 함수(미국 워싱턴 D.C.)에서 AWS RDS(서울 리전)에 접속 불가

```
Can't reach database server at skindit-db.cxe2o4asy4ld.ap-northeast-2.rds.amazonaws.com:5432
```

**원인**:

1. RDS 보안 그룹 인바운드 규칙이 개발자 IP만 허용
2. RDS 퍼블릭 액세스가 비활성화 상태

**해결**:

1. 보안 그룹 인바운드에 `0.0.0.0/0` (PostgreSQL 5432) 추가
2. AWS CloudShell에서 퍼블릭 액세스 활성화:

```bash
aws rds modify-db-instance --db-instance-identifier skindit-db --publicly-accessible --apply-immediately
```

**교훈**: Vercel 서버리스는 IP가 유동적이라 고정 IP 제한이 불가. DB 보안은 강력한 비밀번호 + SSL로 대체.

---

### 6-2. Turbo 빌드 시 환경변수 경고

**문제**: Vercel 배포 시 `NEXTAUTH_URL` 환경변수 누락 경고

```
Warning - the following environment variables are set on your Vercel project, but missing from "turbo.json"
```

**원인**: `turbo.json`의 `env` 배열에 `NEXTAUTH_URL`이 빠져 있어 Turbo가 빌드에 환경변수를 전달하지 못함

**해결**: `turbo.json`에 누락된 환경변수 추가

```json
"env": ["ANTHROPIC_API_KEY", "DATABASE_URL", "NEXTAUTH_SECRET", ..., "NEXTAUTH_URL"]
```

---

### 6-3. Turborepo 도입과 모노레포 전환

**배경**: 초기에는 단일 Next.js 프로젝트로 시작했으나, 공통 UI 컴포넌트와 ESLint/TypeScript 설정을 여러 패키지에서 공유해야 하는 상황이 생김. Turborepo를 도입하여 모노레포로 전환.

**문제**: Turborepo 전환 후 빌드가 전혀 되지 않는 상황 발생. 터미널에 에러만 쌓이고 개발 서버도 실행 불가.

**원인**:
1. `turbo.json`의 `tasks` 설정에서 `dependsOn: ["^build"]`가 올바르게 설정되지 않아 빌드 순서 충돌
2. 공유 패키지(`@workspace/ui`, `@workspace/eslint-config`, `@workspace/typescript-config`)의 `package.json`에 `exports` 필드 누락
3. pnpm workspace 프로토콜(`workspace:*`)과 Turbo의 패키지 해석 간 버전 충돌

**해결**:
1. `turbo.json`에 `build`, `dev`, `lint`, `typecheck` 태스크를 명확하게 분리
2. 각 공유 패키지에 올바른 `exports` 및 `main` 필드 추가
3. 환경변수를 `turbo.json`의 `env` 배열에 명시적으로 등록 (빠뜨리면 빌드 시 환경변수가 전달되지 않음)

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "env": ["ANTHROPIC_API_KEY", "DATABASE_URL", "NEXTAUTH_SECRET", ...]
    }
  }
}
```

**교훈**: Turborepo는 빌드 캐싱과 병렬 실행으로 성능이 좋지만, 초기 설정에서 환경변수/의존성 순서를 정확히 잡아야 한다. 특히 **환경변수를 turbo.json에 등록하지 않으면 Vercel 배포 시 빌드에 전혀 전달되지 않는다**는 점이 가장 큰 함정이었음.

---

### 6-4. AI 코드 어시스턴트 도구 전환 (Cursor → Claude Code)

**배경**: 초기 개발에 Google의 AI 코드 어시스턴트(Cursor + AI 모델)를 사용했으나, 코드가 복잡해지면서 심각한 문제가 발생.

**문제**:
1. AI가 생성한 코드에서 **런타임 에러**가 빈번하게 발생하지만, AI가 원인을 찾지 못하고 같은 실수를 반복
2. 프로젝트 컨텍스트를 제대로 이해하지 못해 **이미 존재하는 코드를 중복 생성**하거나, 다른 파일과 **import 경로가 충돌**하는 코드를 작성
3. 에러가 발생하면 근본 원인을 파악하지 않고 **임시 방편(workaround)만 반복** 적용 → 코드 품질 저하
4. 결국 전체 빌드가 깨져서 **개발이 완전히 멈추는 상황** 발생

**해결**: Claude Code(Anthropic CLI)로 전환
- 프로젝트 전체 컨텍스트를 파악한 상태에서 코드 생성
- 에러 발생 시 **근본 원인 분석 → 해결** 순서로 접근
- 기존 코드 구조를 존중하면서 수정

**교훈**: AI 코드 도구는 **코드 생성 능력**보다 **프로젝트 컨텍스트 이해 능력**이 더 중요하다. 작은 함수 하나 잘 짜는 것보다, 3,000줄짜리 파일의 전체 흐름을 이해하고 그 안에서 올바른 위치에 올바른 코드를 넣을 수 있는지가 핵심.

---

### 6-5. AI Hallucination — 잘못된 성분 정보 생성

**문제**:

- 식약처에 등록된 성분을 "미등록 성분"이라고 잘못 표시
- PDRN 성분의 수용체를 A2A가 아닌 A1으로 잘못 설명
- 비타민C + PDRN을 "금지 콤보"로 잘못 분류 (실제로는 시너지)

**원인**:

1. MFDS API에서 한글 표기명으로 검색 실패 → "미등록"으로 단정
2. Claude Haiku가 불확실한 정보를 확신있게 생성 (Hallucination)

**해결** (3단계 접근):

1. **자체 성분 DB 구축** (`lib/ingredient-db.ts`): 주요 30개 성분의 과학적으로 검증된 데이터를 하드코딩하여 AI 프롬프트에 주입 → Haiku가 정확한 데이터 기반으로 답변
2. **MFDS 컨텍스트 개선**: API에서 못 찾은 성분은 "미등록"이 아닌 "데이터 없음"으로 처리. 없는 건 아예 언급하지 않도록 프롬프트에 명시
3. **프롬프트 강화**: 모든 분석 프롬프트에 "데이터에 있는 것만 언급, 추측 금지" 절대 규칙 추가

**교훈**: AI 모델의 Hallucination을 막으려면 **검증된 데이터를 프롬프트에 직접 주입**하는 RAG 방식이 가장 효과적. "지어내지 마"보다 "이 데이터만 써"가 더 정확함.

---

### 6-6. API 500 에러로 분석 결과 실패

**문제**: Anthropic API가 간헐적으로 500 에러를 반환하여 사용자에게 오류 화면 노출

**해결**: 클라이언트 + 서버 양쪽에 자동 재시도 로직 구현

```typescript
// 서버: 최대 3회 재시도, 지수 백오프
for (let attempt = 0; attempt < 3; attempt++) {
  const res = await fetch("https://api.anthropic.com/v1/messages", { ... });
  if (res.status >= 500 && attempt < 2) {
    await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    continue;
  }
  // ...
}
```

**결과**: 일시적 서버 에러 시 사용자는 로딩이 약간 길어질 뿐, 오류 화면을 거의 보지 않게 됨.

---

### 6-7. 카카오 OAuth prompt 파라미터 미지원

**문제**: Google OAuth의 `prompt: "select_account"`를 Kakao에도 적용했더니 서버 에러 발생

**원인**: Kakao OAuth는 `prompt` 파라미터를 지원하지 않음 (`login`, `select_account` 모두 불가)

**해결**: Google만 `prompt: "select_account"` 적용, Kakao는 기본 설정 유지

```typescript
Google({
  authorization: { params: { prompt: "select_account" } },
}),
Kakao({
  // prompt 파라미터 없음 - Kakao가 자체 처리
}),
```

**교훈**: OAuth 스펙이 동일해도 **프로바이더마다 지원 범위가 다름**. 반드시 개별 테스트 필요.

---

### 6-8. page.tsx 3,211줄 → 컴포넌트 분리

**문제**: 메인 페이지가 3,211줄로 비대해져 유지보수 어려움

**해결**: 4단계 컴포넌트화

1. **타입/상수/유틸 분리** (types/, constants/, lib/) → ~300줄 감소
2. **소형 UI 컴포넌트** (Md, ScoreRing 등 9개) → ~400줄 감소
3. **결과 컴포넌트** (SingleResult, RoutineResult, CompareResult) → ~740줄 감소
4. **디렉토리 구조화** (ui/ + analysis/)

**결과**: 3,211줄 → **1,667줄** (48% 감소), 14개 컴포넌트로 분리

---

### 6-9. OCR이 영어로 성분을 반환

**문제**: 한국 화장품 전성분표를 OCR했을 때 영어로 결과가 반환됨

**원인**: OCR 프롬프트가 영어로만 작성되어 있어 AI가 영어로 응답

**해결**:

- 한국어 모드: "반드시 한글 성분명으로 반환. 영어로 적혀있어도 한글 번역"
- 영어 모드: "한국 라벨을 읽어서 영어로 번역 반환"
- 프론트에서 `lang` 파라미터를 OCR API에 전달

---

### 6-10. 모바일 채팅 입력창 짤림

**문제**: 모바일에서 채팅 입력창을 누르면 키보드에 의해 입력창이 화면 밖으로 밀려남

**원인**: `position: absolute; bottom: 0` 사용 → 키보드 올라오면 뷰포트 변화에 대응 못함

**해결**: `position: sticky; bottom: 0` + `pb-[env(safe-area-inset-bottom)]` (아이폰 홈바 대응)

---

## 7. 성능 최적화

### API 호출 병렬화

MFDS 식약처 API와 AI 분석 요청을 순차 → 병렬 실행으로 변경하여 **1~2초 단축**

### 자체 성분 DB로 API 호출 절감

트렌딩 성분 8개는 로컬 DB에서 즉시 반환 (API 호출 0회). 분석 시에도 자체 DB에 있는 성분은 MFDS API 호출 스킵.

### 컴포넌트 분리로 번들 최적화

3,211줄 단일 파일 → 14개 파일로 분리. 직접 경로 import로 트리쉐이킹 최적화 (배럴 파일 미사용).

---

## 8. 보안

| 보안 항목      | 구현                                                     |
| -------------- | -------------------------------------------------------- |
| 인증           | NextAuth v5, Database 세션, Google/Kakao OAuth2          |
| API Rate Limit | IP당 5회/분, 50회/일                                     |
| Bot 차단       | User-Agent 패턴 매칭 (bot, crawler, curl 등)             |
| CORS           | 허용 오리진 화이트리스트                                 |
| 보안 헤더      | X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| 역할 기반 접근 | admin/user 역할 분리, 어드민 API 별도 인증               |

---

## 9. 배운 점

1. **AI 프롬프트 엔지니어링**: "지어내지 마"보다 "이 데이터만 써"가 100배 효과적. 검증된 데이터를 프롬프트에 직접 주입하는 것이 Hallucination 방지의 핵심.

2. **비용 vs 정확도 트레이드오프**: Claude Haiku(저비용, 빠름) + 자체 성분 DB(정확도 보완) 조합으로 비용은 낮추면서 정확도는 유지하는 전략.

3. **OAuth 프로바이더별 차이**: 같은 OAuth 2.0 스펙이라도 Google과 Kakao의 지원 범위가 다름. 반드시 프로바이더별 문서 확인 및 개별 테스트 필요.

4. **모바일 우선 개발**: 사용자의 80%가 모바일. `position: sticky` + `safe-area-inset` 같은 모바일 전용 CSS가 필수.

5. **컴포넌트 설계**: 초기에 빠르게 만든 3,211줄 파일도 역할별로 분리하면 유지보수성이 크게 향상. 단, Next.js에서는 배럴 파일(index.ts) 대신 직접 경로 import가 트리쉐이킹에 유리.

---

## 10. 향후 계획

- [ ] 결제 연동 (Toss Payments)
- [ ] 대안 제품 추천 기능
- [ ] 성분 트렌드 해설 콘텐츠
- [ ] 피부과 방문 리포트 (프로 기능)
- [ ] 시술 추천 리포트 (프로 기능)
- [ ] Vercel Function Region 서울(icn1) 변경으로 응답 속도 개선
