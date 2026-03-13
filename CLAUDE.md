# CLAUDE.md — AI 컨텍스트 파일

> 이 파일은 Claude가 프로젝트를 이해하고 효과적으로 코드를 작성하기 위한 컨텍스트를 제공합니다.

---

## 프로젝트 개요

**LiarGame AI** — AI가 플레이어로 참여하는 실시간 멀티플레이어 라이어게임 웹앱

- **핵심 가치**: 링크 하나로 시작, AI가 빈자리를 채우고, AI가 게임을 분석해준다
- **타겟 사용자**: 온라인으로 파티게임을 즐기는 친구 그룹, 소규모 인원(2~3명)
- **차별점**: AI가 실제 플레이어로 게임에 참여하는 유일한 라이어게임

---

## 게임 규칙 요약

### 기본 라이어 모드

- 라이어 1명(키워드 모름) vs 시민들(같은 키워드)
- 순서대로 키워드 설명 → 토론 → 투표로 라이어 지목
- 라이어 지목 시 정답 맞히기 역전 기회
- 승패: 시민이 라이어를 찾고 라이어가 정답 실패 → 시민 승 / 라이어 미지목 또는 정답 성공 → 라이어 승

### 바보 모드

- 바보 1명(다른 키워드) vs 시민들(같은 키워드)
- 바보는 자기 키워드가 다르다는 사실을 모름
- 승패: 바보 지목 → 시민 승 / 바보 미지목 → 바보 승

---

## 기술 스택

| 분류       | 기술                                         | 용도                                                                      |
| ---------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| 프레임워크 | Next.js (App Router) + TypeScript + React 19 | 풀스택 단일 프로젝트 (SSR + API Routes)                                   |
| 스타일링   | TailwindCSS v4 + shadcn/ui + Lucide React    | 유틸리티 CSS + UI 컴포넌트 + 아이콘                                       |
| 상태 관리  | Zustand                                      | 게임 상태 (방 정보, 플레이어, phase)                                      |
| 실시간     | Supabase Realtime                            | Postgres Changes + Broadcast + Presence                                   |
| DB         | Supabase PostgreSQL                          | 6개 테이블 (rooms, players, descriptions, messages, votes, game_analyses) |
| AI         | Claude API (@anthropic-ai/sdk)               | 키워드 생성, AI 플레이어 행동, 사후 분석                                  |
| 배포       | Vercel                                       | Next.js 최적화 배포                                                       |
| 패키지     | npm                                          | 의존성 관리                                                               |

---

## 아키텍처

### 단일 프로젝트 풀스택 구조

- 별도 백엔드 서버 없음. Next.js API Routes (Route Handlers)가 서버 역할
- Claude API 호출은 모두 서버사이드 (`/api/ai/*`)에서 실행 — API 키 노출 방지
- Supabase 클라이언트는 브라우저용(`client.ts`)과 서버용(`server.ts`) 분리

### 게임 상태 머신 (7단계)

```
waiting → role_reveal → description → discussion → vote → [final_defense] → result
```

- `waiting`: 대기실 (플레이어 입장, 설정)
- `role_reveal`: 역할/키워드 확인
- `description`: 턴제 설명 입력
- `discussion`: 자유 토론 채팅
- `vote`: 투표
- `final_defense`: 라이어 정답 맞히기 (조건부, 기본 모드 한정)
- `result`: 결과 + AI 분석

### 실시간 동기화 전략

- **Postgres Changes**: rooms/players/descriptions/messages/votes 테이블 변경 구독
- **Broadcast**: phase_change, timer_sync, turn_change 이벤트
- **Presence**: 플레이어 온/오프라인 상태 추적

---

## 디렉토리 구조

```
src/
├── app/                    # App Router 페이지 + API Routes
│   ├── page.tsx            # 홈 (방 생성/입장)
│   ├── room/[roomId]/      # 대기실/게임/결과 통합 페이지
│   ├── api/rooms/          # 방 관리 API
│   └── api/ai/             # AI 엔드포인트 5개
├── components/
│   ├── home/               # 홈 페이지 전용
│   ├── lobby/              # 대기실 전용
│   ├── game/               # 게임 진행 전용 (phase별 컴포넌트)
│   ├── result/             # 결과 페이지 전용
│   └── ui/                 # shadcn/ui 컴포넌트
├── hooks/                  # 커스텀 훅 (useRoom, usePlayers, useTimer, usePresence)
├── store/                  # Zustand 스토어 (game-store, player-store)
├── lib/
│   ├── supabase/           # Supabase 클라이언트 (client.ts, server.ts)
│   ├── ai/                 # Claude API 클라이언트 + 프롬프트 템플릿
│   ├── game-logic.ts       # 승패 판정, 역할 배정 (순수 함수)
│   └── utils.ts            # 방 코드 생성, 세션 토큰 등
├── types/                  # TypeScript 타입 (Room, Player, Phase 등)
└── constants/              # 카테고리/키워드 목록, 게임 설정 상수
```

---

## 코드 컨벤션

### 일반

- **언어**: TypeScript strict 모드
- **린트**: ESLint + Prettier
- **네이밍**: 컴포넌트 PascalCase, 함수/변수 camelCase, 상수 UPPER_SNAKE_CASE
- **파일명**: 컴포넌트 PascalCase.tsx, 유틸/훅 kebab-case.ts

### 컴포넌트 구조

- 서버 컴포넌트 기본, 클라이언트 상태 필요 시 `'use client'` 명시
- props 타입은 컴포넌트 파일 상단에 `interface` 또는 `type`으로 정의
- UI 로직과 비즈니스 로직 분리: 훅에서 데이터/로직 처리, 컴포넌트는 렌더링만

### 상태 관리

- Zustand 스토어는 `store/` 디렉토리에 기능별 분리
- 서버 상태(DB)는 Supabase Realtime 구독으로 동기화
- 클라이언트 전용 상태(현재 플레이어 세션)만 Zustand + localStorage 영속화

### API Routes

- Route Handlers (`app/api/*/route.ts`) 사용
- 입력 검증은 Zod 스키마
- 에러 응답: `{ error: string }` 형식 + 적절한 HTTP 상태 코드
- Claude API 호출 시 타임아웃 5초, 실패 시 폴백 응답

### Git 컨벤션

- **브랜치명**: 영어 (`feature/lobby-ui`, `fix/vote-logic`)
- **커밋 메시지**: 한국어 (기능 단위로 커밋, 의미 있는 메시지)
- `git add`는 명시적 파일 지정 (`.` 또는 `-A` 지양)

---

## DB 스키마 (Supabase)

6개 테이블, 모두 UUID PK:

- **rooms**: 방 상태 (room_code, mode, phase, keyword, turn_order, timer 설정, result)
- **players**: 플레이어 (nickname, is_ai, is_host, role, is_connected, session_token)
- **descriptions**: 설명 (player_id, content, turn_number)
- **messages**: 토론 채팅 (player_id, content)
- **votes**: 투표 (voter_id, target_id)
- **game_analyses**: AI 분석 (analysis_content JSONB)

FK 관계: players → rooms, descriptions/messages/votes/game_analyses → rooms + players

---

## AI 연동 (5개 엔드포인트)

모든 AI 호출은 `app/api/ai/` 하위의 서버사이드 Route Handler에서 실행.

| 엔드포인트              | 호출 시점             | 역할                                          |
| ----------------------- | --------------------- | --------------------------------------------- |
| `POST /api/ai/keywords` | 게임 시작 (바보 모드) | 카테고리별 연관 키워드 쌍 생성                |
| `POST /api/ai/describe` | AI 플레이어 턴        | 역할별 전략적 설명 (2~4초 딜레이)             |
| `POST /api/ai/discuss`  | 토론 단계 일정 간격   | AI 토론 메시지 생성                           |
| `POST /api/ai/vote`     | 투표 단계 시작        | AI 전략적 투표                                |
| `POST /api/ai/analyze`  | 게임 종료             | 사후 분석 (의심 포인트, 핵심 단서, 전략 평가) |

프롬프트 템플릿: `lib/ai/prompts.ts`에 역할별/기능별 시스템 프롬프트 정의

---

## 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=       # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase 익명 키 (브라우저)
SUPABASE_SERVICE_ROLE_KEY=      # Supabase 서비스 역할 키 (서버 전용)

# AI
ANTHROPIC_API_KEY=              # Claude API 키 (서버 전용)
```

---

## 개발 명령어

```bash
npm run dev        # 개발 서버 (http://localhost:3000)
npm run build      # 프로덕션 빌드
npm run lint       # ESLint 검사
npm run test       # Vitest 테스트 실행
```

---

## 주요 문서

| 문서     | 경로               | 설명                                                               |
| -------- | ------------------ | ------------------------------------------------------------------ |
| 상세 PRD | `docs/prd.md`      | MVP 기능 명세, 페이지별 상세, 데이터 모델, AI 연동, 게임 상태 머신 |
| 메타 PRD | `docs/prd_meta.md` | 린캔버스 정의, PRD 작성 요청 구조                                  |
| 로드맵   | `ROADMAP.md`       | 6주 3 Phase 개발 로드맵, 마일스톤                                  |
