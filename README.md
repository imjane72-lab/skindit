# skindit

> 사진 한 장으로 내 피부에 맞는 성분을 찾고, 같이 쓰면 안 되는 제품 조합을 미리 확인하는 AI 화장품 성분 분석 서비스

[🌐 **서비스 바로가기**](https://skindit-web.vercel.app) · [📄 **포트폴리오 자세히 보기 →**](./PORTFOLIO.md) · [📝 **기술블로그 (velog)**](https://velog.io/@wisely/posts)

---

## 이 프로젝트가 뭔가요

기존 성분 분석 앱(화해 등)을 쓰면서 답답했던 두 가지를 풀어보고 싶어서 만들었습니다.

1. **개인화가 안 된다** — 같은 성분이어도 건성/지성/민감성에 따라 추천 여부가 달라야 하는데, 모든 사용자에게 똑같은 등급만 보여줘요.
2. **성분 간 궁합을 안 알려준다** — 비타민C와 레티놀처럼 같이 쓰면 자극이 되는 조합이 있는데, 이걸 미리 알려주는 곳이 없었어요.

그래서 **피부 프로필 기반 분석 + 루틴 궁합 검사 + 식약처 데이터 기반 RAG**를 직접 구축했습니다. 1인 풀스택 개발(기획 / 디자인 / FE / BE / DevOps / MCP) 프로젝트입니다.

## 핵심 기능

- **AI 성분 분석** — 단일 제품 / 루틴 궁합 / A vs B 비교 3가지 모드
- **사진 OCR** — Claude Vision으로 전성분표 사진 → 텍스트 (한/영 지원)
- **올리브영 자동 검색** — 제품명 입력 → ScrapingBee로 전성분 자동 추출 + `ProductCache` 영구 캐시
- **AI 피부 상담 채팅** — 피부과 전문의 페르소나, 사용자 프로필 자동 반영, 응답 스트리밍
- **피부 일지 + AI 월간 리포트** — 5일 누적 시 패턴 분석
- **pgvector 기반 유사 분석 검색** — OpenAI 임베딩 + HNSW 인덱스. 채팅에서 "비슷한 분석 있어?" 물으면 Claude가 Tool로 호출해 코사인 유사도로 검색
- **MCP 서버** — Claude Desktop에서도 같은 서비스 사용 가능 (Tool 7 + Resource 1, 읽기 전용 stdio)

## 기술 스택 (요약)

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 16.1 (App Router), React 19.2, TypeScript 5.9, Tailwind CSS 4.1 |
| Backend | Next.js API Routes (16개), Prisma 6, PostgreSQL 16 + **pgvector(HNSW)**, NextAuth v5 (DB 세션) |
| AI / RAG | Claude Haiku 4.5 (분석/채팅/OCR/리포트), OpenAI text-embedding-3-small(1536d), 식약처 MFDS API + 자체 성분 DB 28개, jsonrepair 응답 복구 |
| 외부 연동 | ScrapingBee (올리브영 크롤링 위임) |
| Infra | Vercel(서울), AWS RDS(서울), Turborepo, pnpm workspaces |
| DevOps | Docker 멀티스테이지(deps → builder → runner), GitHub Actions CI, Swagger API 문서 |
| MCP | `@modelcontextprotocol/sdk` (Stdio Transport), Tool 7 + Resource 1 |

자세한 아키텍처 다이어그램, 의사결정 배경, 트러블슈팅 STAR 정리는 [**PORTFOLIO.md**](./PORTFOLIO.md)에 있습니다.

## 모노레포 구조

```
skindit/
├── apps/
│   ├── web/          # Next.js 16 메인 서비스 (16 API routes, 10 Prisma models)
│   └── mcp-server/   # Claude Desktop용 MCP 서버 (Tool 7 + Resource 1)
├── packages/
│   ├── ui/                   # shadcn/ui 기반 공유 컴포넌트
│   ├── eslint-config/
│   └── typescript-config/
├── Dockerfile        # 3-stage 빌드 (deps → builder → runner)
├── docker-compose.yml
└── .github/workflows/ci.yml   # Lint → Typecheck → Prisma migrate → Build → Docker 이미지 빌드
```

## 로컬 실행

```bash
pnpm install
pnpm --filter web exec prisma generate
pnpm --filter web exec prisma migrate dev
pnpm --filter web dev   # http://localhost:3000
```

Docker Compose로 Postgres + 웹을 한 번에 띄우려면:

```bash
docker compose up --build
```

### 필요한 환경변수 (`apps/web/.env.local`)

| 키 | 용도 |
|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 (SSL 권장) |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth 세션 |
| `ANTHROPIC_API_KEY` | Claude Haiku (분석/채팅/OCR/리포트) |
| `MFDS_API_KEY` | 식약처 화장품 원료성분 공공 API |
| `OPENAI_API_KEY` | OpenAI Embedding (분석 결과 임베딩 생성) |
| `SCRAPINGBEE_API_KEY` | 올리브영 크롤링 위임 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` | Kakao OAuth |

## 문서

- 📄 **[포트폴리오 (면접관용 상세)](./PORTFOLIO.md)** — 아키텍처, 의사결정, 트러블슈팅 STAR 정리
- 📝 **[기술블로그 (velog)](https://velog.io/@wisely/posts)** — 회고와 학습 노트

---

만든 사람: **김지혜** · imjane72@gmail.com · [velog](https://velog.io/@wisely/posts) · [GitHub](https://github.com/imjane72-lab)
