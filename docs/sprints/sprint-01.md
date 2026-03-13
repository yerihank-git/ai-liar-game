# Sprint 1 — 프로젝트 초기 설정 + Supabase DB + 홈 페이지

> **기간**: 2026-03-13
> **상태**: ✅ 완료
> **목표**: Next.js 프로젝트를 초기화하고, Supabase DB 스키마를 설계하며, 홈 페이지와 방 생성/입장 기능을 구현하여 동작하는 프로토타입을 만든다.

---

## 완료 작업

### 1. Next.js 프로젝트 스캐폴딩

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm install zustand @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk tw-animate-css
```

- App Router + TypeScript strict 모드
- TailwindCSS v4 (PostCSS 기반)
- `@/*` import alias 설정 (절대 경로 import)
- Vitest 테스트 프레임워크 추가

### 2. shadcn/ui 초기 설정

```bash
npx shadcn@latest init --defaults -y
npx shadcn@latest add card input dialog badge avatar
```

- `@base-ui/react` 기반 shadcn v4 설치 (기존 Radix UI 기반과 구분 필요)
- 설치 컴포넌트: Button, Card, Input, Dialog, Badge, Avatar
- `src/components/ui/` 하위에 자동 생성됨

### 3. Supabase DB 마이그레이션 설계

**파일**: `supabase/migrations/001_initial_schema.sql`

6개 테이블 설계:

| 테이블 | 핵심 설계 결정 |
|--------|--------------|
| `rooms` | `turn_order JSONB` 배열로 턴 순서 저장, `result JSONB`로 유연한 결과 구조 허용 |
| `players` | `session_token TEXT`으로 회원가입 없이 사용자 식별, `is_ai BOOLEAN`으로 AI 플레이어 구분 |
| `descriptions` | `turn_number INTEGER`로 설명 순서 추적 |
| `messages` | 토론 채팅 전용 테이블 분리 |
| `votes` | `UNIQUE(room_id, voter_id)` 제약으로 중복 투표 DB 레벨에서 방지 |
| `game_analyses` | `analysis_content JSONB`으로 AI 분석 결과 구조 유연성 확보 |

추가 설계:
- `updated_at` 자동 갱신 트리거 (rooms, players)
- RLS 활성화 + `allow_all` 정책 (실제 보안은 서버사이드 `session_token` 검증)
- 5개 테이블 Realtime publication 등록

### 4. TypeScript 타입 정의

**파일**: `src/types/game.ts`

- `GameMode`, `GamePhase`, `PlayerRole`, `GameWinner` 리터럴 타입
- DB 행 인터페이스: `Room`, `Player`, `Description`, `Message`, `Vote`, `GameAnalysis`
- AI 분석 구조: `AnalysisContent`, `SuspicionPoint`, `StrategyEvaluation`
- API 요청/응답 타입: `CreateRoomRequest/Response`, `JoinRoomRequest/Response`

### 5. 게임 상수 및 유틸리티

**파일**: `src/constants/game-config.ts`, `src/constants/categories.ts`, `src/lib/utils.ts`

- `GAME_CONFIG`: 인원 제한, 타이머 옵션, AI 닉네임 상수
- `CATEGORIES`: 10개 카테고리 × 20개 키워드 (총 200개)
- `generateRoomCode()`: 혼동 문자(I, O, 0, 1 등) 제외한 6자리 영숫자
- `generateSessionToken()`: 브라우저/Node.js 환경 감지 후 crypto API 사용
- `formatCountdown()`: 밀리초 → `MM:SS` 포맷 변환

### 6. Supabase 클라이언트 분리

**파일**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`

- `client.ts`: `createBrowserClient` (클라이언트 컴포넌트용, `NEXT_PUBLIC_*` 키)
- `server.ts`: `service_role` 키 사용 (API Route 전용, `autoRefreshToken: false`)

### 7. 레이아웃 및 헤더

**파일**: `src/app/layout.tsx`, `src/components/layout/Header.tsx`

- sticky 헤더, SEO 메타데이터 (title, description, keywords)

### 8. 홈 페이지 UI

**파일**: `src/app/page.tsx`

- 히어로 섹션: 서비스 소개 + CTA 버튼 (방 만들기 / 방 코드 입장)
- 특징 카드 3개, 게임 규칙 요약 카드 2개 (기본 / 바보 모드)

### 9. 방 생성/입장 다이얼로그

**파일**: `src/components/home/CreateRoomDialog.tsx`, `src/components/home/JoinRoomDialog.tsx`

- 닉네임 유효성 검사 (2~12자)
- `sessionToken` 생성 후 `localStorage` 저장
- API 호출 성공 시 `/room/[roomId]`로 라우팅

### 10. API Routes

**파일**: `src/app/api/rooms/route.ts`
- `POST /api/rooms`: 방 생성 (방 코드 유니크 보장, host_player_id 업데이트)
- `GET /api/rooms?code=XXXXXX`: 방 코드 → roomId 변환

**파일**: `src/app/api/rooms/[roomId]/join/route.ts`
- `POST /api/rooms/[roomId]/join`: 방 입장 (게임 중 입장 차단, 만원 차단, 세션 재접속 처리)

### 11. 게임 페이지 스켈레톤

**파일**: `src/app/room/[roomId]/page.tsx`

- `localStorage` 세션 복원 → 없으면 홈 리다이렉트
- `rooms`, `players` 테이블 Realtime 구독
- phase 기반 컴포넌트 분기 구조 준비

---

## 기술적 결정 및 근거

### 세션 관리: JWT 대신 sessionToken

**결정**: 회원가입 없이 `localStorage`에 랜덤 64자 hex 토큰 저장

**근거**: 파티게임 특성상 빠른 진입이 핵심 가치. 게임 수명(24시간)이 짧아 Supabase Auth 도입 비용 대비 효과 없음.

### 중복 투표 방지: DB UNIQUE 제약

**결정**: `UNIQUE(room_id, voter_id)` DB 레벨 제약

**근거**: 동시 요청 경합 상황에서도 DB 레벨에서 원자적으로 방지. 게임 무결성에 치명적인 항목이므로 최하단 레이어에서 처리.

### Realtime: players 변경 시 전체 재조회

**결정**: payload.new 사용 대신 변경 감지 후 `select * where room_id = ...` 재조회

**근거**: INSERT/DELETE/UPDATE 모두 단일 핸들러로 처리 가능. 방당 최대 8명으로 성능 문제 없음.

---

## 트러블슈팅

### `next lint` 명령 실패

- **증상**: `Invalid project directory provided, no such directory: .../lint`
- **원인**: Next.js v16 CLI가 `lint`를 서브커맨드가 아닌 디렉터리 인수로 해석
- **해결**: `npm run build` 시 타입 체크로 대체. ESLint는 직접 실행

### 빌드 시 Google Fonts TLS 오류

- **증상**: `Failed to fetch Geist from Google Fonts — TLS error`
- **원인**: Windows 11 환경에서 Turbopack이 시스템 루트 인증서를 사용하지 않음
- **해결**: `next.config.ts`에 `experimental.turbopackUseSystemTlsCerts: true` 추가

### `DialogTrigger asChild` 타입 오류

- **증상**: `Property 'asChild' does not exist on type 'IntrinsicAttributes & Props<unknown>'`
- **원인**: shadcn v4가 Radix UI 대신 `@base-ui/react` 사용 — `asChild` 패턴 미지원
- **해결**: `DialogTrigger` 제거 후 controlled state + `onClick={() => setOpen(true)}` 방식으로 전환

```tsx
// Before (Radix UI 방식)
<DialogTrigger asChild><Button>열기</Button></DialogTrigger>

// After (@base-ui/react 방식)
<span onClick={() => setOpen(true)} style={{ display: "contents" }}>
  <Button>열기</Button>
</span>
<Dialog open={open} onOpenChange={setOpen}>...</Dialog>
```

---

## Sprint 1 완료 기준 검증

| 완료 기준 | 결과 |
|-----------|------|
| `npm run build` 에러 없이 성공 | ✅ |
| 홈 페이지 렌더링 정상 | ✅ |
| 방 생성/입장 API Routes 구현 | ✅ |
| Supabase 마이그레이션 SQL 작성 완료 | ✅ |
| TypeScript 타입 오류 없음 | ✅ |
| 게임 페이지 Realtime 구독 구조 준비 | ✅ |

---

## Sprint 2 준비 사항

**선행 조건** (직접 수행 필요):
- [ ] Supabase 프로젝트 생성 + SQL 마이그레이션 실행
- [ ] `.env.local` 환경변수 설정

**Sprint 2 구현 예정**:
- Zustand 스토어 (`game-store.ts`, `player-store.ts`)
- Supabase Realtime 훅 (`useRoom`, `usePlayers`, `usePresence`)
- 대기실 UI (플레이어 목록, 초대 링크, 게임 설정, AI 플레이어 추가)
- AI 플레이어 추가/제거 + 방장/참가자 권한 분리
