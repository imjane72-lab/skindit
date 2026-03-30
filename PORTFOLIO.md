# skindit - AI 피부 타입별 성분 분석 서비스

> 2만 개+ 식약처 성분 데이터 기반, 사진 한 장으로 성분 해석부터 조합 경고까지

**배포 URL**: https://skindit-web.vercel.app
**GitHub**: https://github.com/imjane72-lab/skindit
**개발 기간**: 2026.03
**개발 인원**: 1인 (기획 / 디자인 / 프론트엔드 / 백엔드)
**총 커밋**: 76개

---

## 1. 프로젝트 소개

skindit은 화장품 전성분을 AI로 분석하여 **내 피부 타입에 맞는 성분 해석, 조합 경고, 루틴 추천**을 제공하는 풀스택 서비스입니다.

### 왜 만들었나?
- 화장품 뒷면 전성분표를 봐도 뭐가 좋고 나쁜지 모르는 사용자가 대다수
- 기존 성분 분석 앱(화해 등)은 성분 하나하나의 등급만 보여주고, **내 피부 타입에 맞는 해석**은 해주지 않음
- "이 두 제품 같이 써도 되나?" 같은 **조합 궁합** 질문에 답해주는 서비스가 없음

### 핵심 차별점
1. **피부 타입 맞춤 분석** - 사용자 프로필(피부 타입, 고민)을 반영한 개인화 분석
2. **조합 경고** - 같이 쓰면 안 되는 성분 콤보 자동 감지
3. **사진 OCR** - 전성분표 사진 한 장으로 자동 텍스트 추출
4. **식약처 데이터 연동** - 2만 개+ 성분 공공데이터 기반 검증

---

## 2. AI-Native 개발 역량

### Claude Code를 활용한 개발 프로세스

이 프로젝트는 **Claude Code(Anthropic CLI)**를 적극 활용하여 개발했습니다. 단순 코드 생성이 아닌, AI와의 협업으로 개발 생산성을 극대화한 과정이 핵심입니다.

**AI 활용 영역:**
| 영역 | AI 활용 방식 | 결과 |
|------|-------------|------|
| 컴포넌트화 | 3,211줄 → 14개 파일 분리를 AI가 의존성 분석 후 자동 추출 | 48% 코드 감소 |
| 프롬프트 엔지니어링 | AI 분석 프롬프트를 22줄 → 3줄로 압축, 정확도 유지 | 응답 2~3초 단축 |
| 트러블슈팅 | Vercel+RDS 연결, Prisma 캐시 문제 등 15개 이슈 해결 | 배포 안정화 |
| DB 설계 | 9개 모델의 관계 설계 + 마이그레이션 자동화 | Type-safe CRUD |

**AI가 제안한 코드를 검증/수정한 사례:**
- AI가 "식약처 미등록 성분"이라고 잘못 생성 → 실제 API 호출로 검증 후 프롬프트 규칙 강화
- AI가 PDRN 수용체를 A1으로 잘못 설명 → 논문 확인 후 A2A로 수정, 자체 성분 DB 구축
- AI가 배럴 파일(index.ts)을 제안 → Next.js 트리쉐이킹 이슈 확인 후 직접 경로 import로 변경

**교훈**: AI 도구는 **생성한 코드를 무조건 신뢰하면 안 된다**. 특히 도메인 지식(의학/화학)이 필요한 영역에서는 반드시 검증 과정이 필요. AI의 제안을 "초안"으로 받아들이고, 검증 → 수정 → 반영하는 프로세스가 핵심.

---

## 3. 기술 스택

### Frontend
| 기술 | 버전 | 선택 이유 |
|------|------|-----------|
| **Next.js** | 16.1 | App Router + Server Components, Turbopack 빌드 성능 |
| **React** | 19.2 | Concurrent Features, Suspense 활용 |
| **TypeScript** | 5.9 | 타입 안전성, 13개 인터페이스로 API 응답 타입 관리 |
| **Tailwind CSS** | 4.1 | Utility-first, 빠른 UI 반복 개발 |

### Backend
| 기술 | 버전 | 선택 이유 |
|------|------|-----------|
| **Next.js API Routes** | 16.1 | 풀스택 단일 프레임워크, 16개 엔드포인트 |
| **Prisma** | 6.x | Type-safe ORM, 자동 마이그레이션, NextAuth 어댑터 |
| **PostgreSQL** | 16 | 관계형 데이터 (유저-프로필-분석기록-일지) |
| **NextAuth** | v5 beta | Database 세션 전략, Google/Kakao OAuth2 |

### AI & Data (Agentic RAG 패턴)
| 기술 | 용도 |
|------|------|
| **Claude Haiku 4.5** | 성분 분석, 채팅 상담, 리포트 생성 (비용 효율적, 분석 1회 ~15~25원) |
| **자체 성분 DB** | 주요 28개 성분의 검증된 과학 데이터를 AI 프롬프트에 주입 (RAG 방식) |
| **식약처 MFDS API** | 2만 개+ 화장품 원료성분 공공데이터 실시간 검증 |

> **RAG 고도화 전략 (4가지 적용):**
> 1. **하이브리드 검색**: 자체 성분 DB(키워드 매칭) + MFDS API(공공데이터 검증)를 병렬 조회하여 정확도와 커버리지를 동시에 확보
> 2. **가드레일(Guardrails)**: 모든 분석 프롬프트에 "답변의 모든 내용이 제공된 컨텍스트에 포함되어 있는지 자체 검증" 규칙 적용. 컨텍스트에 없는 성분 효능/부작용은 출력 차단
> 3. **출처 표기(Citation)**: 검증된 성분 데이터 기반 답변 시 "식약처 등록 성분이에요", "검증된 데이터 기준으로" 등 출처를 명시하여 신뢰도 향상. star_ingredients에 `source` 필드 추가
> 4. **No-Answer 전략**: 데이터에 없는 내용은 추측 대신 "확인이 필요합니다" 또는 "피부과 전문의와 상담해보세요"로 답변 — Hallucination 방지의 마지노선

### Infra & DevOps
| 기술 | 용도 |
|------|------|
| **Vercel** | 배포 + CDN + 서버리스 함수 (서울 리전) |
| **AWS RDS** | PostgreSQL 데이터베이스 (서울 리전) |
| **Turborepo** | 모노레포 빌드 캐싱 + 병렬 실행 |
| **pnpm** | 워크스페이스 기반 패키지 관리 |
| **Git** | 76개 커밋, 기능별 커밋 메시지 관리 |

---

## 4. 시스템 아키텍처

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
│  /api/analyze ── Claude Haiku ◄── 자체 DB + MFDS (RAG) │
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

## 5. 데이터 모델링

### ERD 설계 (9개 모델)

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
- `AnalysisHistory.resultJson`: 분석 결과를 JSON 컬럼으로 저장하여 스키마 변경 없이 결과 형식 확장 가능
- `SkinDiary`에 인덱스 `(userId, date DESC)`: 월별 일지 조회 시 효율적 정렬
- `CreditTransaction`에 `type` 필드(charge/analysis/chat/report): 크레딧 사용처 추적
- `User.role`(user/admin): 역할 기반 접근 제어, 어드민 API 분리

---

## 6. 주요 기능 & AI 파이프라인

### 6-1. AI 성분 분석 (핵심 기능)

**3가지 분석 모드:**
- **단일 제품**: 전성분 → 점수(0-100) + 고민별 분석 + 추천/주의 성분 + 안전도 차트
- **루틴 궁합**: 2개 이상 제품 → 충돌 감지 + 시너지 분석 + 최적 사용 순서
- **성분 비교**: A vs B 제품 → 공통/고유 성분 + 어떤 피부에 뭐가 맞는지

**분석 파이프라인 (RAG 패턴):**
```
사용자 입력 (텍스트/OCR)
    ↓
① 자체 성분 DB 조회 (lib/ingredient-db.ts) ─┐
② MFDS 식약처 API 조회 (lib/mfds-api.ts) ───┤ 병렬 실행
                                              ↓
③ 프롬프트 조합 (사용자 피부타입 + 검증된 데이터 + AI 지시)
    ↓
④ Claude Haiku API 호출 (최대 3회 자동 재시도, 지수 백오프)
    ↓
⑤ JSON 파싱 (잘린 응답 자동 복구) + 점수 정규화 + 결과 렌더링
```

### 6-2. AI 피부 상담 (채팅)

피부과 경력 30년차 여의사 페르소나. 사용자 피부 프로필을 자동 반영한 맞춤 답변.
- 물어본 것만 답변 (역질문/추가 유도 금지)
- 핵심 2-4문장으로 즉시 답변

### 6-3. 사진 OCR (다국어)
- **한국어 모드**: 한글 전성분 → 한글 반환 (영어 성분도 한글 번역)
- **영어 모드**: 한국 라벨 → 영어 번역 반환

### 6-4. 피부 일지 & 월간 리포트
매일 피부 상태를 기록하면 5일 이상 데이터 축적 시 AI가 패턴을 분석하여 월간 리포트 생성.

---

## 7. 프로젝트 구조

```
apps/web/
├── app/                          # 페이지 라우트 (8개 페이지)
│   ├── page.tsx                    # 메인 (1,667줄)
│   ├── chat/page.tsx               # AI 상담
│   ├── diary/                      # 피부 일지 + 리포트
│   ├── history/page.tsx            # 분석 기록
│   ├── profile/page.tsx            # 피부 프로필
│   ├── pricing/page.tsx            # 요금제
│   ├── admin/page.tsx              # 관리자 대시보드
│   └── api/                        # 16개 API 엔드포인트
├── components/
│   ├── ui/                         # 범용 UI (Md, Counter, ScoreRing, ErrState)
│   └── analysis/                   # 분석 결과 (SingleResult, RoutineResult 등 8개)
├── lib/
│   ├── api.ts                        # AI API 호출 + 재시도 로직
│   ├── ingredient-db.ts              # 자체 성분 DB (RAG용)
│   ├── mfds-api.ts                   # 식약처 공공데이터 API
│   ├── auth.ts                       # NextAuth 설정
│   └── score-utils.ts                # 점수 계산 유틸
├── types/analysis.ts               # 13개 TypeScript 인터페이스
├── constants/skin-data.ts          # 피부 고민, 트렌딩 성분 데이터
└── prisma/schema.prisma            # DB 스키마 (9개 모델)
```

**코드 규모:** TypeScript/TSX 57개 파일 | 컴포넌트 14개 | API 16개 | DB 모델 9개 | 커밋 76개

---

## 8. 트러블슈팅 (15개)

### 8-1. Vercel 배포 시 DB 연결 실패
**문제**: Vercel 서버리스(미국)에서 AWS RDS(서울)에 접속 불가 — 보안 그룹이 개발자 IP만 허용, 퍼블릭 액세스 비활성
**해결**: 보안 그룹 `0.0.0.0/0` 추가 + AWS CloudShell에서 `--publicly-accessible` 활성화
**교훈**: Vercel 서버리스는 IP가 유동적. DB 보안은 강력한 비밀번호 + SSL로 대체.

### 8-2. Turbo 빌드 시 환경변수 누락
**문제**: `turbo.json`에 `NEXTAUTH_URL`이 빠져 Vercel 빌드에 환경변수 미전달
**해결**: `turbo.json`의 `env` 배열에 모든 환경변수 명시적 등록

### 8-3. Turborepo 모노레포 전환 시 빌드 실패
**문제**: 빌드 순서 충돌, 공유 패키지 `exports` 누락, pnpm workspace 버전 충돌
**해결**: 태스크 분리 + `exports`/`main` 필드 추가 + 환경변수 명시 등록
**교훈**: **환경변수를 turbo.json에 등록 안 하면 Vercel 배포 시 빌드에 전혀 전달 안 됨** — 가장 큰 함정

### 8-4. Prisma Client 생성 누락
**문제**: Vercel 캐시 환경에서 `prisma generate` 미실행 → 런타임 에러
**해결**: `"build": "prisma generate && next build"`
**교훈**: Vercel은 캐시된 node_modules 사용. Prisma 공식 문서에서도 이 패턴 권장.

### 8-5. AI Hallucination — 잘못된 성분 정보 생성
**문제**: 등록 성분을 "미등록"으로 표시, PDRN 수용체 오류(A1→A2A), 비타민C+PDRN 금지 콤보 오분류
**해결**: ① 자체 성분 DB 구축 (RAG) ② MFDS 컨텍스트 "데이터 없음" 처리 ③ "추측 금지" 절대 규칙
**교훈**: **"지어내지 마"보다 "이 데이터만 써"가 100배 효과적.** 검증된 데이터를 프롬프트에 주입하는 RAG 방식이 핵심.

### 8-6. API 500 에러 — 자동 재시도 구현
**문제**: Anthropic API 간헐적 500 에러 → 사용자에게 오류 노출
**해결**: 클라이언트 + 서버 양쪽에 최대 3회 재시도, 지수 백오프 (1.5초, 3초, 4.5초)

### 8-7. page.tsx 3,211줄 → 컴포넌트 분리
**문제**: 메인 페이지 3,211줄로 유지보수 어려움
**해결**: 4단계 분리 — 타입/상수/유틸 → 소형 UI 9개 → 결과 컴포넌트 3개 → 디렉토리 구조화
**결과**: 3,211줄 → **1,667줄** (48% 감소), ui/ + analysis/ 구조

### 8-8. OCR이 영어로 성분 반환
**문제**: 한국 화장품인데 영어로 OCR 결과 반환
**해결**: 언어별 프롬프트 분리 + 프론트에서 `lang` 파라미터 전달

### 8-9. 모바일 채팅 입력창 짤림
**문제**: `position: absolute` → 키보드 올라오면 입력창 밀려남
**해결**: `position: sticky` + `pb-[env(safe-area-inset-bottom)]` (아이폰 홈바 대응)

### 8-10. 제품명 검색 기능 폐기 결정
**문제**: Puppeteer 스크래핑 정확도 부족 (리뉴얼 버전 혼동, Cold Start 5~10초)
**결정**: 부정확한 데이터보다 기능 폐기가 낫다고 판단. API/UI 전체 삭제.
**교훈**: **정확도가 보장 안 되면 서비스 신뢰도를 떨어뜨린다.** 기능을 빼는 것도 중요한 제품 결정.

### 8-11. Suspense 경계 누락으로 빌드 실패
**문제**: `useSearchParams()`가 Suspense 없이 사용 → 빌드 에러 (로컬 dev에서는 정상)
**해결**: `<Suspense>` 래핑으로 프리렌더/하이드레이션 분리

### 8-12. 공유 URL 딥링크 미작동
**문제**: 모든 공유가 메인 URL로 연결 (탭/페이지 구분 없음)
**해결**: `?tab=single|routine|compare` 파라미터 + 페이지별 URL 분리

### 8-13. 로그인 후 컨텍스트 유실
**문제**: 비로그인 상태에서 입력 후 로그인하면 입력 데이터/탭 상태 유실
**해결**: `callbackUrl`에 탭 파라미터 + `sessionStorage`에 입력 데이터 보존

### 8-14. AI 응답 JSON 파싱 실패 — 잘린 응답 복구
**문제**: `max_tokens` 한도 도달 시 JSON 잘림 → `JSON.parse()` 실패
**해결**: 3단계 복구 (정상 파싱 → 닫는 괄호 추가 → 재시도) + `max_tokens` 증가
**교훈**: 외부 API 응답은 **항상 불완전할 수 있다**는 전제로 방어적 파싱 구현.

### 8-15. 사용자 피부 고민 결과 누락
**문제**: 5개 고민 선택 시 3~4개만 표시
**해결**: JSON 스키마의 `max 4` 제한 삭제 + "선택한 고민 전부 포함" 명시

---

## 9. 성능 최적화

| 최적화 | 방법 | 효과 |
|--------|------|------|
| **API 병렬화** | MFDS API + AI 호출 순차 → 병렬 실행 | 1~2초 단축 |
| **프롬프트 압축** | 22줄 → 3줄 (60% 감소), max_tokens 4096→3200 | 2~3초 단축 |
| **자체 성분 DB** | 트렌딩 8개 즉시 반환 (API 호출 0회) | 로딩 제거 |
| **MFDS 타임아웃** | 2초 초과 시 스킵 | 느린 API가 전체를 막지 않음 |
| **컴포넌트 분리** | 3,211줄 → 14개 파일, 직접 경로 import | 트리쉐이킹 최적화 |

---

## 10. 보안

| 보안 항목 | 구현 |
|-----------|------|
| 인증 | NextAuth v5, Database 세션, Google/Kakao OAuth2 |
| API Rate Limit | IP당 5회/분, 50회/일 (in-memory Map) |
| Bot 차단 | User-Agent 패턴 매칭 (bot, crawler, curl 등) |
| CORS | 허용 오리진 화이트리스트 |
| 보안 헤더 | X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| 역할 기반 접근 | admin/user 역할 분리, 어드민 API 별도 인증 |

---

## 11. 배운 점

1. **RAG 고도화**: 단순 데이터 주입을 넘어, 하이브리드 검색(키워드+API) + 가드레일(자체 검증) + 출처 표기 + No-Answer 전략 4가지를 조합해야 실무용 AI 서비스의 신뢰도를 확보할 수 있다.

2. **AI 도구와의 협업**: AI가 생성한 코드를 무조건 신뢰하면 안 됨. 특히 도메인 지식이 필요한 영역(의학/화학)에서는 AI 제안 → 검증 → 수정 프로세스가 필수.

3. **비용 vs 정확도 트레이드오프**: Claude Haiku(저비용, 빠름) + 자체 성분 DB(정확도 보완) 조합으로 분석 1회 ~25원에 높은 정확도 달성.

4. **모바일 우선 UX**: `position: sticky` + `safe-area-inset`, 딥링크, 로그인 컨텍스트 보존 등 모바일 환경에서의 실전 UX 이슈 해결 경험.

5. **"빼는" 제품 결정**: 제품명 검색 기능을 정확도 문제로 폐기한 경험. 기능을 빼는 것도 중요한 제품 결정이라는 걸 배움.

6. **인프라 이해**: Turborepo 환경변수 함정, Vercel 서버리스 IP 유동성, Prisma 캐시 문제 등 배포 환경에서만 발생하는 이슈 해결 경험.

---

## 12. 향후 계획

- [ ] 프로 플랜 + 결제 연동 (Toss Payments) — 크레딧 API 구현 완료
- [ ] 대안 제품 추천 기능
- [ ] 성분 트렌드 해설 콘텐츠
- [ ] GitHub Actions CI/CD 파이프라인 구축
- [ ] 에러 모니터링 (Sentry 연동)
- [x] 트러블 원인 / 시술 추천 / 피부과 방문 리포트 (무료 전환 완료)
- [x] Vercel Function Region 서울(icn1) 전환 완료
- [x] 프롬프트 60% 압축, 응답 속도 2~3초 단축
