# 프로젝트 로드맵 - LiarGame AI

## 개요

- **프로젝트 목표**: 친구들과 링크 하나로 즉시 라이어게임을 시작할 수 있으며, AI가 플레이어로 참여하고 게임을 분석해주는 실시간 멀티플레이어 웹앱
- **전체 예상 기간**: 6주 (3개 Phase, 각 Phase 2주 스프린트)
- **현재 진행 단계**: Phase 0 — PRD 작성 완료, 개발 착수 전
- **팀 규모 가정**: 소규모 팀 1~2명
- **아키텍처**: Next.js (App Router) 풀스택 단일 프로젝트 + Supabase (DB/Realtime) + Claude API

---

## 진행 상태 범례

- [ ] 예정
- [x] 완료
- 🔄 진행 중
- ⏸️ 보류

---

## 프로젝트 현황 대시보드

| 항목 | 상태 |
|------|------|
| 전체 진행률 | **MVP 완료 — 프로덕션 배포 완료** |
| 현재 Phase | Phase 3 완료 (Sprint 6 완료) |
| 프로덕션 URL | **[https://ai-liar-game.vercel.app](https://ai-liar-game.vercel.app)** |
| PRD 완료일 | 2026-03-13 |
| MVP 완료일 | 2026-03-14 |
| MVP 기능 범위 | F001~F017 전체 구현 완료 |

---

## 기술 아키텍처 결정 사항

| 결정 사항 | 선택 | 이유 |
|-----------|------|------|
| **프론트엔드** | Next.js (App Router) + React 19 + TypeScript | 서버 컴포넌트, API Routes로 백엔드 분리 불필요, Vercel 최적화 |
| 스타일링 | TailwindCSS v4 + shadcn/ui | 빠른 UI 개발, 접근성 준수 컴포넌트, 모바일 우선 반응형 |
| 상태관리 | Zustand | 게임 상태(방 정보, 플레이어 목록, phase) 클라이언트 관리 |
| 실시간 통신 | Supabase Realtime (Postgres Changes + Broadcast + Presence) | WebSocket 직접 구현 없이 managed 서비스, 무료 플랜 충분 |
| 데이터베이스 | Supabase PostgreSQL | 방/플레이어/설명/채팅/투표/분석 6개 테이블, RLS 보안 |
| AI 연동 | Claude API (@anthropic-ai/sdk) | 자연스러운 한국어 생성, 역할별 전략적 응답, Next.js API Routes에서 서버사이드 호출 |
| 배포 | Vercel | Next.js 최적화, 무료 플랜으로 충분, GitHub 연동 CI/CD |
| 패키지 관리 | npm | 표준 도구 |

---

## 프로젝트 구조

```
liargame-ai/
├── src/
│   ├── app/                          # App Router 페이지
│   │   ├── layout.tsx                # 루트 레이아웃
│   │   ├── page.tsx                  # 홈 페이지 (/)
│   │   ├── room/
│   │   │   └── [roomId]/
│   │   │       └── page.tsx          # 대기실/게임/결과 통합 페이지
│   │   └── api/
│   │       ├── rooms/                # 방 생성/조회 API
│   │       │   └── route.ts
│   │       ├── rooms/[roomId]/
│   │       │   ├── join/route.ts     # 방 입장
│   │       │   ├── start/route.ts    # 게임 시작 (역할 배정)
│   │       │   ├── describe/route.ts # 설명 제출
│   │       │   ├── vote/route.ts     # 투표 제출
│   │       │   ├── guess/route.ts    # 라이어 정답 맞히기
│   │       │   └── next-phase/route.ts # phase 전환
│   │       └── ai/
│   │           ├── keywords/route.ts # AI 키워드 쌍 생성
│   │           ├── describe/route.ts # AI 플레이어 설명
│   │           ├── discuss/route.ts  # AI 토론 참여
│   │           ├── vote/route.ts     # AI 투표
│   │           └── analyze/route.ts  # AI 사후 분석
│   ├── components/
│   │   ├── layout/                   # Header
│   │   ├── home/                     # 홈 페이지 전용 (히어로, 규칙 설명)
│   │   ├── lobby/                    # 대기실 전용 (플레이어 목록, 설정)
│   │   ├── game/                     # 게임 진행 전용
│   │   │   ├── RoleReveal.tsx        # 역할 확인 카드
│   │   │   ├── DescriptionPhase.tsx  # 턴제 설명 단계
│   │   │   ├── DiscussionPhase.tsx   # 토론 채팅
│   │   │   ├── VotePhase.tsx         # 투표 UI
│   │   │   ├── FinalDefense.tsx      # 최후의 변론
│   │   │   └── PlayerList.tsx        # 플레이어 상태 표시
│   │   ├── result/                   # 결과 페이지 전용
│   │   │   ├── ResultBanner.tsx      # 승패 배너
│   │   │   ├── RoleRevealTable.tsx   # 역할 공개 테이블
│   │   │   ├── VoteVisualization.tsx # 투표 시각화
│   │   │   └── AIAnalysis.tsx        # AI 사후 분석
│   │   └── ui/                       # shadcn/ui 컴포넌트
│   ├── hooks/
│   │   ├── useRoom.ts               # 방 상태 구독
│   │   ├── usePlayers.ts            # 플레이어 목록 구독
│   │   ├── useGamePhase.ts          # 게임 phase 관리
│   │   ├── useTimer.ts              # 타이머 동기화
│   │   └── usePresence.ts           # 접속 상태 관리
│   ├── store/
│   │   ├── game-store.ts            # 게임 전역 상태 (Zustand)
│   │   └── player-store.ts          # 현재 플레이어 세션 상태
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # 브라우저 Supabase 클라이언트
│   │   │   └── server.ts            # 서버사이드 Supabase 클라이언트
│   │   ├── ai/
│   │   │   ├── claude.ts            # Claude API 클라이언트
│   │   │   └── prompts.ts           # AI 프롬프트 템플릿
│   │   ├── game-logic.ts            # 승패 판정, 역할 배정 등 순수 로직
│   │   └── utils.ts                 # 유틸리티 (방 코드 생성 등)
│   ├── types/
│   │   ├── game.ts                  # 게임 관련 타입 (Room, Player, Phase 등)
│   │   └── database.ts              # Supabase 테이블 타입 (자동 생성)
│   └── constants/
│       ├── categories.ts            # 키워드 카테고리 및 사전 정의 키워드
│       └── game-config.ts           # 게임 설정 상수 (타이머 기본값, 최대 인원 등)
├── supabase/
│   └── migrations/                  # Supabase 마이그레이션 SQL
│       └── 001_initial_schema.sql   # 6개 테이블 생성
├── __tests__/
│   ├── lib/
│   │   └── game-logic.test.ts       # 게임 로직 단위 테스트
│   ├── api/
│   │   └── rooms.test.ts            # API 라우트 테스트
│   └── components/
│       └── game/                    # 게임 컴포넌트 테스트
├── .github/
│   └── workflows/
│       ├── ci.yml                   # 린트/타입체크/테스트/빌드
│       └── deploy.yml               # Vercel 자동 배포
├── docs/
│   ├── prd.md                       # 상세 PRD
│   └── prd_meta.md                  # 메타 PRD (린캔버스)
├── ROADMAP.md
├── CLAUDE.md
├── package.json
└── next.config.ts
```

---

## 의존성 맵

```
Phase 1 (프로젝트 기반 + 방 관리 + UI)
├── Sprint 1: 프로젝트 초기 설정 + Supabase DB + 홈 페이지
│   └── 모든 후속 작업의 기반
└── Sprint 2: 대기실 UI + 실시간 플레이어 동기화 + 게임 페이지 스켈레톤
    ├── 의존: Sprint 1의 Supabase 테이블 + 프로젝트 구조
    └── Supabase Realtime 기본 연동

Phase 2 (게임 핵심 로직 + AI 연동)
├── Sprint 3: 게임 상태 머신 + 역할 배정 + 설명/투표 + 결과
│   ├── 의존: Phase 1의 DB 스키마 + 실시간 기반
│   └── 게임 플레이 E2E 흐름 완성 (AI 제외)
└── Sprint 4: Claude API 연동 (5개 AI 엔드포인트) + AI 플레이어 통합
    └── 의존: Sprint 3의 게임 로직 완성

Phase 3 (완성도 + 테스트 + 배포)
├── Sprint 5: 토론 채팅 고도화 + 타이머 + 반응형 + 에러 처리
│   └── 의존: Phase 2의 전체 기능 완성
└── Sprint 6: 테스트 + CI/CD + Vercel 배포 + 최종 QA
    └── 의존: Sprint 5의 품질 기준 달성
```

---

## Phase 1: 프로젝트 기반 + 방 관리 + UI (Sprint 1~2)

> **기간**: 2주 (2026-03-13 ~ 2026-03-27)
> **우선순위**: Must Have
> **목표**: Next.js 프로젝트를 초기화하고, Supabase에 6개 테이블을 생성하며, 홈 페이지와 대기실 UI를 완성하여 방 생성/입장/설정/실시간 플레이어 동기화가 작동하는 프로토타입을 만든다.

### Sprint 1: 프로젝트 초기 설정 + Supabase DB + 홈 페이지 (1주차)

- [ ] **Next.js 프로젝트 초기 설정**: 개발 환경 구성
  - `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - shadcn/ui 초기화 및 기본 컴포넌트 설치 (Button, Card, Input, Dialog, Toast, Badge, Avatar)
  - Lucide React 아이콘 라이브러리 설치
  - ESLint + Prettier 설정
  - 추가 패키지: `npm install zustand @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk`

- [ ] **Supabase 프로젝트 설정**: DB 및 Realtime 기반
  - Supabase 프로젝트 생성 (무료 플랜)
  - 환경 변수 설정: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `lib/supabase/client.ts`: 브라우저용 Supabase 클라이언트 (createBrowserClient)
  - `lib/supabase/server.ts`: 서버사이드 Supabase 클라이언트 (createServerClient)

- [ ] **Supabase 마이그레이션**: 6개 테이블 생성
  - `supabase/migrations/001_initial_schema.sql`:
    - `rooms` 테이블 (id, room_code, host_player_id, mode, phase, category, keyword, fool_keyword, current_turn_player_id, turn_order, timer 설정, phase_started_at, max_players, result, timestamps)
    - `players` 테이블 (id, room_id, nickname, is_ai, is_host, role, is_connected, role_confirmed, session_token, timestamps)
    - `descriptions` 테이블 (id, room_id, player_id, content, turn_number, timestamps)
    - `messages` 테이블 (id, room_id, player_id, content, timestamps)
    - `votes` 테이블 (id, room_id, voter_id, target_id, timestamps)
    - `game_analyses` 테이블 (id, room_id, analysis_content, timestamps)
  - RLS (Row Level Security) 정책 설정
  - Realtime 활성화 (rooms, players, descriptions, messages, votes 테이블)

- [ ] **TypeScript 타입 정의**: 게임 데이터 모델
  - `types/game.ts`: Room, Player, Description, Message, Vote, GameAnalysis 타입
  - `types/game.ts`: Phase enum ('waiting' | 'role_reveal' | 'description' | 'discussion' | 'vote' | 'final_defense' | 'result')
  - `types/game.ts`: GameMode ('classic' | 'fool'), PlayerRole ('citizen' | 'liar' | 'fool')
  - `types/database.ts`: Supabase 자동 생성 타입 또는 수동 매핑

- [ ] **게임 상수 및 유틸리티 정의**
  - `constants/categories.ts`: 카테고리별 키워드 목록 (음식, 동물, 장소, 직업, 스포츠 등 최소 10개 카테고리, 각 20개 이상 키워드)
  - `constants/game-config.ts`: 최소 인원(3), 최대 인원(8), 최대 AI(2), 타이머 기본값 등
  - `lib/utils.ts`: 방 코드 생성 (6자리 영숫자), 세션 토큰 생성 (64자)

- [ ] **공통 레이아웃 구현**: 헤더 및 기본 레이아웃
  - `components/layout/Header.tsx`: LiarGame AI 로고 (홈 링크) + 방 코드 표시 (게임 중일 때)
  - `app/layout.tsx`: 루트 레이아웃에 Header 포함, 메타데이터 설정

- [ ] **홈 페이지 구현 (F001)**: 서비스 소개 + 방 생성/입장
  - 히어로 섹션: "링크 하나로 시작하는 AI 라이어게임" + 게임 규칙 간단 설명
  - "방 만들기" 버튼 → 닉네임 입력 Dialog → `POST /api/rooms` 호출 → `/room/[roomId]` 이동
  - 방 코드 입력 + "입장" 버튼 → 닉네임 입력 Dialog → `/room/[roomId]` 이동
  - `app/api/rooms/route.ts`: 방 생성 API (rooms INSERT, 방장 players INSERT, room_code 생성)

- [ ] **방 입장 API 구현 (F001)**
  - `app/api/rooms/[roomId]/join/route.ts`: 닉네임 + session_token으로 방 입장 (players INSERT)
  - 방이 가득 찼거나 게임 중이면 에러 반환
  - 초대 링크 접속 시 닉네임 입력 → 입장 처리

### Sprint 2: 대기실 UI + 실시간 동기화 + 게임 페이지 스켈레톤 (2주차)

- [ ] **Zustand 스토어 구현**: 게임 전역 상태
  - `store/game-store.ts`: 현재 방 정보, 플레이어 목록, 게임 phase, 설명 목록, 투표 상태
  - `store/player-store.ts`: 현재 플레이어 세션 (playerId, sessionToken, nickname) — localStorage 영속화

- [ ] **Supabase Realtime 훅 구현 (F012)**: 실시간 동기화 기반
  - `hooks/useRoom.ts`: rooms 테이블 UPDATE 구독 (phase 전환, 설정 변경, 턴 변경)
  - `hooks/usePlayers.ts`: players 테이블 INSERT/UPDATE/DELETE 구독 (입퇴장, 상태 변경)
  - `hooks/usePresence.ts`: Supabase Presence로 플레이어 온/오프라인 추적
  - 방장 이탈 시 다른 플레이어에게 방장 자동 이전

- [ ] **대기실 페이지 UI 구현 (F002, F003, F004, F005, F014, F017)**
  - `app/room/[roomId]/page.tsx`: phase에 따라 대기실/게임/결과 분기 렌더링
  - `components/lobby/PlayerList.tsx`: 실시간 플레이어 목록 (닉네임, 방장 왕관, AI 뱃지, 접속 상태 점)
  - `components/lobby/InviteLink.tsx`: 초대 링크 복사 버튼 (F002)
  - `components/lobby/GameSettings.tsx` (방장 전용):
    - 모드 선택 토글: 기본 라이어 / 바보 (F003)
    - AI 플레이어 추가/제거 버튼 (최대 2명) (F004)
    - 카테고리 선택 드롭다운 (F005)
    - 타이머 설정: 설명 30/60/90초, 토론 1/2/3분, 투표 15/30초 (F014)
  - "게임 시작" 버튼 (최소 3명 시 활성화, 방장만)
  - "나가기" 버튼

- [ ] **게임 페이지 스켈레톤 구현**: phase 전환 구조
  - `app/room/[roomId]/page.tsx`: phase 값에 따른 컴포넌트 분기
    - `waiting` → Lobby 컴포넌트
    - `role_reveal` → RoleReveal 컴포넌트
    - `description` → DescriptionPhase 컴포넌트
    - `discussion` → DiscussionPhase 컴포넌트
    - `vote` → VotePhase 컴포넌트
    - `final_defense` → FinalDefense 컴포넌트
    - `result` → Result 컴포넌트
  - 각 컴포넌트 스켈레톤 파일 생성 (빈 UI, 추후 Sprint 3에서 구현)

### Phase 1 완료 기준 (Definition of Done)

- [ ] 홈 페이지에서 방 생성 → 대기실 진입이 정상 작동한다
- [ ] 초대 링크로 다른 브라우저에서 방 입장이 가능하다
- [ ] 대기실에서 플레이어 목록이 실시간으로 업데이트된다 (입퇴장)
- [ ] 방장이 게임 설정(모드, AI, 카테고리, 타이머)을 변경하면 참가자에게 실시간 반영된다
- [ ] AI 플레이어 추가/제거가 정상 작동한다
- [ ] 최소 3명일 때 "게임 시작" 버튼이 활성화된다
- [ ] Supabase Realtime 연결이 안정적으로 유지된다
- [ ] `npm run build` 에러 없이 성공
- [ ] `npm run lint` 린트 에러 없음

### Phase 1 개발 명령어

```bash
# 개발 서버 실행
npm run dev                    # http://localhost:3000

# Supabase 로컬 개발 (선택)
npx supabase start             # 로컬 Supabase
npx supabase db push           # 마이그레이션 적용

# 빌드/린트 검증
npm run build
npm run lint
```

---

## Phase 2: 게임 핵심 로직 + AI 연동 (Sprint 3~4)

> **기간**: 2주 (2026-03-27 ~ 2026-04-10)
> **우선순위**: Must Have
> **목표**: 게임 상태 머신을 구현하여 역할 배정 → 설명 → 토론 → 투표 → 결과의 전체 흐름을 완성하고, Claude API를 연동하여 AI 플레이어가 게임에 참여하도록 한다.

### Sprint 3: 게임 상태 머신 + 핵심 플레이 로직 (3주차)

- [ ] **게임 시작 API 구현 (F006)**: 역할 배정 + 키워드 선택
  - `app/api/rooms/[roomId]/start/route.ts`:
    - 플레이어 중 랜덤 1명 라이어(또는 바보) 배정
    - 카테고리에서 랜덤 키워드 선택 (기본 모드) 또는 AI 키워드 쌍 생성 (바보 모드)
    - 턴 순서 랜덤 결정
    - rooms.phase를 'role_reveal'로 업데이트
    - phase_started_at 설정
  - `lib/game-logic.ts`: 역할 배정 로직, 턴 순서 결정 로직 (순수 함수)

- [ ] **역할 확인 단계 구현 (F006)**
  - `components/game/RoleReveal.tsx`:
    - 카드 뒤집기 애니메이션 (역할 + 키워드 표시)
    - 시민: "당신은 시민입니다" + 키워드
    - 라이어: "당신은 라이어입니다" (키워드 없음)
    - 바보: "당신은 시민입니다" + 바보 키워드 (본인은 바보인지 모름)
    - "확인 완료" 버튼 → players.role_confirmed = true
    - 전원 확인 시 → description phase로 자동 전환

- [ ] **설명 단계 구현 (F007)**
  - `components/game/DescriptionPhase.tsx`:
    - 현재 턴 플레이어 하이라이트 + 타이머 표시
    - 이전 플레이어들의 설명 목록 (실시간 표시)
    - 자신의 턴: 텍스트 입력 + "제출" 버튼
    - 다른 사람 턴: 대기 화면
    - 타이머 초과 시 자동 빈 제출
  - `app/api/rooms/[roomId]/describe/route.ts`: 설명 제출 API (descriptions INSERT, 다음 턴 전환)
  - `hooks/useTimer.ts`: 서버 시각(phase_started_at) 기준 카운트다운 타이머

- [ ] **투표 단계 구현 (F009)**
  - `components/game/VotePhase.tsx`:
    - 플레이어 목록에서 투표 대상 선택 (자기 자신 제외)
    - 투표 완료 후 변경 불가
    - 투표 현황: 완료 인원 수만 표시 (내용 비공개)
    - 타이머 초과 시 미투표자는 랜덤 처리
  - `app/api/rooms/[roomId]/vote/route.ts`: 투표 제출 API (votes INSERT, 전원 완료 시 집계)
  - 동점 시 재투표 처리 로직

- [ ] **최후의 변론 + 결과 구현 (F010, F011)**
  - `components/game/FinalDefense.tsx`:
    - 기본 모드에서 최다 득표자가 라이어일 때만 활성화
    - 라이어에게 정답 키워드 입력 필드 + 제출 버튼
    - 다른 플레이어는 대기 화면
    - 타이머 초과 시 자동 실패 처리
  - `app/api/rooms/[roomId]/guess/route.ts`: 라이어 정답 맞히기 API
  - `lib/game-logic.ts`: 승패 판정 로직 (기본 모드 3가지 / 바보 모드 2가지 분기)
  - `components/result/ResultBanner.tsx`: 승패 결과 배너
  - `components/result/RoleRevealTable.tsx`: 전체 역할 + 키워드 공개 테이블
  - `components/result/VoteVisualization.tsx`: 투표 결과 시각화
  - "다시하기" (F016) / "나가기" 버튼

- [ ] **phase 전환 API 구현**: 게임 상태 머신 서버 로직
  - `app/api/rooms/[roomId]/next-phase/route.ts`: 조건 검증 후 phase 전환
  - 각 phase 전환 시 phase_started_at 갱신, 필요한 데이터 초기화

### Sprint 4: Claude API 연동 + AI 플레이어 통합 (4주차)

- [ ] **Claude API 클라이언트 설정**
  - 환경 변수: `ANTHROPIC_API_KEY`
  - `lib/ai/claude.ts`: Anthropic SDK 클라이언트 초기화, 공통 호출 함수 (에러 처리, 타임아웃 포함)
  - 모델: claude-sonnet-4-6 (비용 최적화, 응답 속도)

- [ ] **AI 프롬프트 템플릿 작성**
  - `lib/ai/prompts.ts`:
    - 키워드 쌍 생성 프롬프트 (바보 모드)
    - 시민 역할 설명 프롬프트
    - 라이어 역할 설명 프롬프트 (추론 기반 모호한 설명)
    - 바보 역할 설명 프롬프트
    - 토론 참여 프롬프트 (역할별 전략)
    - 투표 결정 프롬프트 (분석 기반)
    - 사후 분석 프롬프트 (해설자 관점)

- [ ] **AI 키워드 쌍 생성 구현 (F005 일부)**
  - `app/api/ai/keywords/route.ts`: POST
  - 입력: 카테고리명
  - 출력: `{ keyword, foolKeyword }`
  - 게임 시작 시 바보 모드일 때 호출
  - 기본 모드는 사전 정의 키워드에서 랜덤 선택

- [ ] **AI 플레이어 설명 생성 구현 (F008)**
  - `app/api/ai/describe/route.ts`: POST
  - 입력: AI 역할, 키워드, 이전 설명 목록, 카테고리
  - 출력: `{ description }`
  - 의도적 딜레이: 2~4초 랜덤 (`setTimeout`)
  - 설명 단계에서 AI 턴 도달 시 자동 호출 → descriptions INSERT → 다음 턴

- [ ] **AI 토론 참여 구현 (F013 일부)**
  - `app/api/ai/discuss/route.ts`: POST
  - 토론 단계에서 30초 간격 또는 메시지 5개마다 자동 호출
  - 역할에 따라 의심/방어 메시지 생성
  - messages INSERT

- [ ] **AI 투표 구현 (F009 일부)**
  - `app/api/ai/vote/route.ts`: POST
  - 투표 단계 시작 시 2~5초 딜레이 후 자동 투표
  - 시민 역할: 가장 의심스러운 플레이어 선택
  - 라이어 역할: 전략적 투표 (자신에게 의심 분산)
  - votes INSERT

- [ ] **AI 사후 분석 구현 (F015)**
  - `app/api/ai/analyze/route.ts`: POST
  - 게임 종료 시 호출
  - 입력: 전체 게임 데이터 (플레이어, 역할, 키워드, 설명, 투표, 결과)
  - 출력: 설명별 분석, 핵심 단서, 전략 평가, 개선 팁
  - game_analyses INSERT
  - `components/result/AIAnalysis.tsx`: 분석 결과 렌더링

### Phase 2 완료 기준 (Definition of Done)

- [ ] 게임 시작 → 역할 확인 → 설명 → 투표 → 결과의 전체 흐름이 멀티플레이어로 작동한다
- [ ] AI 플레이어가 설명, 토론, 투표에 자연스럽게 참여한다
- [ ] 바보 모드에서 AI가 연관 키워드 쌍을 생성한다
- [ ] 기본 모드에서 라이어 정답 맞히기 (역전) 시나리오가 정상 작동한다
- [ ] 바보 모드에서 바보 지목/미지목 승패 판정이 정확하다
- [ ] AI 사후 분석이 결과 페이지에 표시된다
- [ ] "다시하기" 시 같은 멤버로 대기실 복귀가 정상 작동한다
- [ ] AI 응답 시간이 5초 이내이다
- [ ] `npm run build` 에러 없이 성공

---

## Phase 3: 완성도 + 테스트 + 배포 (Sprint 5~6)

> **기간**: 2주 (2026-04-10 ~ 2026-04-24)
> **우선순위**: Must Have (배포) + Should Have (품질)
> **목표**: 토론 채팅 고도화, 반응형 디자인, 에러 처리를 완료하고, 테스트 및 CI/CD 파이프라인을 구축한 뒤 Vercel에 프로덕션 배포한다.

### Sprint 5: 토론 고도화 + 반응형 + 에러 처리 (5주차)

- [ ] **토론 채팅 고도화 (F013)**
  - `components/game/DiscussionPhase.tsx`:
    - 실시간 채팅 UI (메시지 목록 + 입력 필드)
    - 상단에 전체 설명 요약 패널 (접기/펼치기)
    - AI 플레이어 자동 채팅 참여 표시 (타이핑 인디케이터)
    - 메시지별 작성자 닉네임, AI 뱃지, 타임스탬프
    - 자동 스크롤
  - `hooks/useMessages.ts`: messages 테이블 INSERT 구독

- [ ] **타이머 시스템 구현 (F014)**
  - `hooks/useTimer.ts`:
    - 서버 시각(phase_started_at) 기준 카운트다운
    - Broadcast `game:timer_sync`로 클라이언트 간 동기화
    - 타이머 만료 시 자동 phase 전환 트리거
  - 설명/토론/투표/최후의변론 각 단계별 타이머 적용

- [ ] **플레이어 상태 표시 (F017)**
  - `components/game/PlayerList.tsx`:
    - 접속 상태 (온라인/오프라인 점)
    - 현재 행동 상태: 입력 중, 제출 완료, 투표 완료
    - Broadcast `player:typing` 이벤트 발행/수신

- [ ] **반응형 디자인 구현**
  - 모바일(~767px): 단일 컬럼, 세로 스크롤 중심 레이아웃
  - 태블릿(768px~1023px): 2컬럼 (게임 영역 + 플레이어 목록)
  - 데스크톱(1024px+): 풀 레이아웃
  - 모바일 터치 최적화: 투표 버튼 크기, 채팅 입력 UX

- [ ] **에러 처리 및 엣지 케이스**
  - 방 코드 잘못 입력 / 존재하지 않는 방 / 만원 방 / 게임 중 입장 시도
  - 플레이어 접속 해제 시: 30초 대기 → 스킵 또는 AI 대체
  - API 호출 실패 시 사용자 친화적 에러 메시지 + 재시도 옵션
  - Supabase Realtime 연결 끊김 시 자동 재연결
  - `app/error.tsx`: 글로벌 에러 바운더리
  - `app/not-found.tsx`: 404 페이지

### Sprint 6: 테스트 + CI/CD + 배포 + 최종 QA (6주차)

- [ ] **단위 테스트 작성**
  - `__tests__/lib/game-logic.test.ts`:
    - 역할 배정 로직 (라이어/바보 1명만 배정되는지)
    - 승패 판정 로직 (기본 모드 3가지 + 바보 모드 2가지 시나리오)
    - 투표 집계 로직 (최다 득표, 동점 처리)
    - 턴 순서 결정 로직
    - 방 코드 생성 유일성
  - `__tests__/api/rooms.test.ts`:
    - 방 생성 API 테스트
    - 방 입장 API 테스트 (정상, 만원, 게임 중)
    - 설명 제출 API 테스트
    - 투표 제출 API 테스트
  - 테스트 프레임워크: Vitest + @testing-library/react

- [ ] **CI/CD 파이프라인 구축**
  - `.github/workflows/ci.yml`:
    - 트리거: push, pull_request (main 브랜치)
    - 단계: 의존성 설치 → 린트 → 타입 체크 → 테스트 → 빌드
  - `.github/workflows/deploy.yml`:
    - 트리거: main 브랜치 push
    - Vercel 자동 배포

- [ ] **Vercel 프로덕션 배포**
  - Vercel 프로젝트 생성, GitHub 연동
  - 환경 변수 설정:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `ANTHROPIC_API_KEY`
  - 커스텀 도메인 설정 (선택)
  - Supabase RLS 정책 프로덕션 검증

- [ ] **최종 QA**
  - E2E 수동 테스트: 방 생성 → 초대 → 입장 → 게임 플레이 → 결과 → 다시하기
  - 멀티 디바이스 테스트: 모바일 2대 + 데스크톱 1대 동시 플레이
  - AI 플레이어 포함 게임 전체 흐름 검증
  - 엣지 케이스 테스트: 플레이어 이탈, 타이머 만료, 동점 투표
  - README.md 작성 (프로젝트 소개, 설치, 실행, 배포 가이드)
  - CLAUDE.md 작성 (AI 컨텍스트 파일 — 채점 기준 9점)

### Phase 3 완료 기준 (Definition of Done)

- [ ] 토론 채팅이 실시간으로 작동하며 AI가 자동 참여한다
- [ ] 모든 타이머가 정확히 작동하고 만료 시 자동 전환된다
- [ ] 모바일(375px), 태블릿(768px), 데스크톱(1280px)에서 정상 표시
- [ ] 단위 테스트가 모두 통과한다 (게임 로직, API)
- [ ] GitHub Actions CI가 push/PR마다 자동 실행된다
- [ ] Vercel에 프로덕션 배포 완료, 실제 URL에서 접속 가능
- [ ] README.md, CLAUDE.md가 충실히 작성되었다
- [ ] `npm run build` && `npm run lint` && `npm run test` 모두 통과

---

## 리스크 및 완화 전략

| 리스크 | 영향도 | 발생 가능성 | 완화 전략 |
|--------|--------|-------------|-----------|
| Claude API 응답 지연/실패 | 높음 | 중간 | 의도적 딜레이(2~4초)로 자연스러운 대기 연출, 타임아웃 5초, 실패 시 사전 정의 응답 폴백 |
| AI 부자연스러운 설명 | 중간 | 중간 | 역할별 세분화된 프롬프트, 이전 설명 컨텍스트 주입, 한국어 자연스러움 테스트 |
| Supabase Realtime 연결 불안정 | 높음 | 낮음 | 자동 재연결 로직, 연결 상태 UI 표시, 폴링 폴백 |
| Supabase 무료 플랜 한도 | 중간 | 중간 | 24시간 후 데이터 자동 삭제, 200 동시 접속 무료 한도 내 운용 |
| 플레이어 중간 이탈 | 중간 | 높음 | 30초 대기 후 스킵 처리, 방장 이탈 시 자동 이전 |
| 동시 요청 경합 (투표, phase 전환) | 중간 | 중간 | Supabase RLS + 서버사이드 조건 검증, 낙관적 잠금 |
| Claude API 비용 급증 | 중간 | 낮음 | 게임당 AI 호출 제한 (최대 10회), 토큰 제한 (출력 200토큰), 경량 모델 사용 |
| Vercel Serverless 콜드 스타트 | 낮음 | 중간 | API Route 경량화, 비동기 처리 |

---

## 마일스톤

| 마일스톤 | 실제 완료일 | 산출물 | 상태 |
|----------|-----------|--------|------|
| M0: PRD 작성 완료 | 2026-03-13 | docs/prd.md, docs/prd_meta.md, ROADMAP.md | ✅ 완료 |
| M1: 프로젝트 초기 설정 + DB | 2026-03-13 | Next.js + Supabase 6테이블 + 홈 페이지 + 방 생성 API | ✅ 완료 |
| M2: 대기실 + 실시간 동기화 | 2026-03-13 | 대기실 UI, Realtime 플레이어 동기화, 게임 설정 | ✅ 완료 |
| M3: 게임 플레이 완성 (AI 미포함) | 2026-03-13 | 역할 배정 → 설명 → 투표 → 결과 전체 흐름 | ✅ 완료 |
| M4: AI 플레이어 연동 완성 | 2026-03-13 | Claude API 5개 엔드포인트, AI 플레이어 전체 참여 | ✅ 완료 |
| M5: 완성도 + 테스트 | 2026-03-14 | 토론 채팅, 타이머, 반응형, 에러 처리, 단위 테스트 | ✅ 완료 |
| M6: 프로덕션 배포 | 2026-03-14 | Vercel 배포, CI/CD, README, CLAUDE.md | ✅ 완료 |

---

## 채점 기준 대응 전략

> 참고: `docs/evaluation-criteria.md` 기준 100점 만점

| 채점 항목 | 배점 | 대응 산출물 | 해당 Sprint |
|-----------|:----:|-------------|-------------|
| 프로젝트 정의 (PRD/README) | 12점 | docs/prd.md, docs/prd_meta.md, README.md | M0, Sprint 6 |
| AI 컨텍스트 (CLAUDE.md) | 9점 | CLAUDE.md (게임 규칙, 기술 스택, 코드 컨벤션, 디렉토리 구조) | Sprint 6 |
| 개발 진행 기록 | 9점 | Git 커밋 이력 (기능 단위 커밋, 한국어 커밋 메시지) | 전체 |
| 아키텍처 | 12점 | 관심사 분리 (components/hooks/store/lib/api), 게임 상태 머신 | Sprint 1~3 |
| 코드 품질 | 10점 | TypeScript strict, ESLint, 일관된 에러 처리 | 전체 |
| 기술 스택 적합성 | 8점 | Next.js + Supabase Realtime + Claude API 조합의 합리성 | Sprint 1 |
| 완성도 | 8점 | 게임 전체 흐름 E2E 작동 | Sprint 3~4 |
| 사용자 경험 | 5점 | 모바일 우선 UI, 직관적 게임 플로우, 자연스러운 AI 연출 | Sprint 5 |
| 반응형/호환성 | 2점 | 모바일/태블릿/데스크톱 반응형 | Sprint 5 |
| 문제 정의 | 4점 | 린캔버스 3가지 문제 정의 | M0 |
| 차별화 | 6점 | AI 플레이어 참여 + 바보 모드 AI 키워드 쌍 + AI 사후 분석 | Sprint 4 |
| 테스트 전략 | 8점 | Vitest 단위 테스트 (게임 로직, API) | Sprint 6 |
| CI/CD 및 자동화 | 7점 | GitHub Actions (lint → typecheck → test → build → deploy) | Sprint 6 |

---

## 향후 계획 (Backlog) — MVP(F001~F017) 범위 외 기능

> ⚠️ 아래 항목들은 **MVP 완료 후 추가 개발 백로그**입니다. 현재 프로덕션 배포([https://ai-liar-game.vercel.app](https://ai-liar-game.vercel.app))에는 포함되지 않습니다.

### 다음 단계 (검토 예정)

- [ ] AI 의심도 힌트 (각 설명에 실시간 의심도 점수 표시)
- [ ] 커스텀 키워드 팩 생성 (사용자가 직접 키워드 등록)
- [ ] 게임 히스토리 / 개인 통계 (승률, 역할별 성적)
- [ ] 관전 모드 (게임 중 입장한 사람이 관전 가능)

### 장기 계획

- [ ] 음성 채팅 연동 (WebRTC)
- [ ] 소셜 로그인 및 프로필
- [ ] 랭킹 시스템
- [ ] 3라운드 이상 연속 게임 모드

---

## 품질 검증 체크리스트

- [ ] PRD의 모든 MVP 기능(F001~F017)이 로드맵에 반영되었는가
- [ ] 각 Phase의 의존성이 올바르게 설정되었는가
- [ ] MVP 범위가 명확하게 정의되었는가 (F001~F017 = MVP)
- [ ] 각 태스크가 실행 가능한 수준으로 구체적인가
- [ ] 기술 스택(Next.js + Supabase + Claude API)이 모두 고려되었는가
- [ ] Supabase Realtime, Broadcast, Presence가 포함되었는가
- [ ] 완료 기준이 측정 가능한가
- [ ] 채점 기준 5개 영역이 모두 커버되는가
- [ ] CI/CD, 테스트, CLAUDE.md 작성이 포함되었는가
