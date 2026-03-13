# LiarGame AI

> **AI가 플레이어로 참여하는 실시간 멀티플레이어 라이어게임 웹앱**

친구들과 링크 하나로 즉시 라이어게임을 시작할 수 있으며, AI가 플레이어로 참여하여 인원이 부족해도 게임을 즐길 수 있고, AI의 실시간 분석으로 게임의 재미와 전략적 깊이를 더합니다.

---

## 문제 정의

| 문제                           | 설명                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **인원 부족**                  | 라이어게임은 최소 4~5명이 필요하지만, 소규모 그룹(2~3명)은 인원을 모으기 어렵습니다.                    |
| **AI 플레이어 부재**           | 기존 온라인 라이어게임 앱은 단순 키워드 배정 수준으로, AI가 실제 플레이어로 참여하는 서비스는 없습니다. |
| **온라인 전환 시 몰입감 저하** | 오프라인 라이어게임을 온라인으로 전환하면 진행이 산만해지고 몰입감이 떨어집니다.                        |

## 솔루션

1. **회원가입 없이 링크로 즉시 입장** — 닉네임만 입력하면 바로 게임 시작
2. **AI가 빈자리를 채움** — Claude AI가 시민/라이어/바보 역할로 게임에 참여 (최대 2명)
3. **AI가 게임을 분석** — 게임 종료 후 각 설명의 의심 포인트, 핵심 단서, 전략 평가를 제공

---

## 주요 기능 (MVP)

### 핵심 기능

| ID   | 기능               | 설명                                                    |
| ---- | ------------------ | ------------------------------------------------------- |
| F001 | 방 생성 및 입장    | 닉네임만으로 방 생성, 초대 링크로 입장. 회원가입 불필요 |
| F002 | 초대 링크 공유     | 고유 방 URL 클립보드 복사                               |
| F003 | 게임 모드 선택     | 기본 라이어 모드 / 바보 모드                            |
| F004 | AI 플레이어 추가   | 대기실에서 AI 1~2명 추가                                |
| F005 | 키워드 시스템      | 카테고리별 랜덤 키워드, 바보 모드 AI 키워드 쌍 생성     |
| F006 | 역할 배정          | 랜덤 라이어/바보 1명, 나머지 시민                       |
| F007 | 턴제 설명          | 순서대로 키워드 설명 입력, 실시간 공개                  |
| F008 | AI 설명 생성       | Claude API로 역할별 전략적 설명 (2~4초 딜레이)          |
| F009 | 투표 시스템        | AI 포함 전원 투표, 최다 득표자 지목                     |
| F010 | 라이어 정답 맞히기 | 지목된 라이어의 역전 기회                               |
| F011 | 결과 발표          | 승패, 역할 공개, 키워드 공개                            |
| F012 | 실시간 동기화      | Supabase Realtime으로 전체 게임 상태 동기화             |

### 지원 기능

| ID   | 기능          | 설명                                         |
| ---- | ------------- | -------------------------------------------- |
| F013 | 토론 채팅     | 자유 채팅 토론, AI도 참여                    |
| F014 | 게임 타이머   | 설명/토론/투표 제한 시간                     |
| F015 | AI 사후 분석  | 의심 포인트, 핵심 단서, 전략 평가, 개선 팁   |
| F016 | 다시하기      | 같은 멤버로 재게임                           |
| F017 | 플레이어 상태 | 접속 상태, 입력 중, 투표 완료 등 실시간 표시 |

---

## 게임 규칙

### 기본 라이어 모드

- **라이어** 1명은 제시어를 모른 채 다른 사람의 설명을 참고해 들키지 않게 설명
- 나머지 **시민**은 동일한 제시어를 받고 설명
- 토론 후 전원 투표로 라이어를 지목

| 조건                    | 결과               |
| ----------------------- | ------------------ |
| 라이어 지목 + 정답 실패 | 시민 승리          |
| 라이어 지목 + 정답 성공 | 라이어 승리 (역전) |
| 라이어 미지목           | 라이어 승리        |

### 바보 모드

- **바보** 1명은 다른 키워드를 받지만 자신이 바보인지 모름
- 나머지 **시민**은 미묘하게 다른 느낌을 캐치하여 바보를 찾아냄

| 조건        | 결과      |
| ----------- | --------- |
| 바보 지목   | 시민 승리 |
| 바보 미지목 | 바보 승리 |

---

## 게임 흐름

```
홈 → 방 만들기 (닉네임) → 대기실 (설정/초대)
→ 게임 시작 → 역할 확인 → 설명 단계 (턴제)
→ 토론 (자유 채팅) → 투표 → [최후의 변론]
→ 결과 + AI 분석 → 다시하기 / 나가기
```

### 게임 상태 머신

```
waiting → role_reveal → description → discussion → vote → [final_defense] → result
```

---

## 기술 스택

| 분류       | 기술                                         | 용도                                                                      |
| ---------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| 프레임워크 | Next.js (App Router) + TypeScript + React 19 | 풀스택 단일 프로젝트 (SSR + API Routes)                                   |
| 스타일링   | TailwindCSS v4 + shadcn/ui + Lucide React    | 유틸리티 CSS + UI 컴포넌트 + 아이콘                                       |
| 상태 관리  | Zustand                                      | 게임 상태 클라이언트 관리                                                 |
| 실시간     | Supabase Realtime                            | Postgres Changes + Broadcast + Presence                                   |
| DB         | Supabase PostgreSQL                          | 6개 테이블 (rooms, players, descriptions, messages, votes, game_analyses) |
| AI         | Claude API (@anthropic-ai/sdk)               | 키워드 생성, AI 플레이어 행동, 사후 분석                                  |
| 배포       | Vercel                                       | Next.js 최적화 배포                                                       |
| 테스트     | Vitest + @testing-library/react              | 단위/컴포넌트 테스트                                                      |
| CI/CD      | GitHub Actions                               | 린트 → 타입체크 → 테스트 → 빌드 → 배포                                    |

---

## 아키텍처

### 단일 프로젝트 풀스택 구조

별도 백엔드 서버 없이 Next.js API Routes (Route Handlers)가 서버 역할을 수행합니다.

- **클라이언트**: React 컴포넌트 + Zustand 스토어 + Supabase Realtime 구독
- **서버**: Next.js API Routes로 방 관리, 게임 로직, AI 호출 처리
- **AI 호출**: 모두 서버사이드 (`/api/ai/*`)에서 실행하여 API 키 노출 방지
- **실시간 동기화**: Supabase Postgres Changes (DB 구독) + Broadcast (이벤트) + Presence (접속 상태)

### 프로젝트 구조

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
│   ├── game/               # 게임 진행 (phase별 컴포넌트)
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

### AI 연동 (5개 엔드포인트)

| 엔드포인트              | 호출 시점             | 역할                                          |
| ----------------------- | --------------------- | --------------------------------------------- |
| `POST /api/ai/keywords` | 게임 시작 (바보 모드) | 카테고리별 연관 키워드 쌍 생성                |
| `POST /api/ai/describe` | AI 플레이어 턴        | 역할별 전략적 설명 (2~4초 딜레이)             |
| `POST /api/ai/discuss`  | 토론 단계             | AI 토론 메시지 생성                           |
| `POST /api/ai/vote`     | 투표 단계             | AI 전략적 투표                                |
| `POST /api/ai/analyze`  | 게임 종료             | 사후 분석 (의심 포인트, 핵심 단서, 전략 평가) |

---

## 데이터베이스 스키마

Supabase PostgreSQL 기반 6개 테이블:

| 테이블          | 역할          | 주요 필드                                                                     |
| --------------- | ------------- | ----------------------------------------------------------------------------- |
| `rooms`         | 방 상태 관리  | room_code, mode, phase, keyword, fool_keyword, turn_order, timer 설정, result |
| `players`       | 플레이어 정보 | nickname, is_ai, is_host, role, is_connected, session_token                   |
| `descriptions`  | 턴제 설명     | player_id, content, turn_number                                               |
| `messages`      | 토론 채팅     | player_id, content                                                            |
| `votes`         | 투표          | voter_id, target_id                                                           |
| `game_analyses` | AI 분석       | analysis_content (JSONB)                                                      |

---

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm
- Supabase 프로젝트 (무료 플랜 가능)
- Anthropic API Key (Claude API)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd liargame-ai

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 환경 변수

`.env.local` 파일에 다음 값을 설정합니다:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=       # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase 익명 키 (브라우저)
SUPABASE_SERVICE_ROLE_KEY=      # Supabase 서비스 역할 키 (서버 전용)

# AI
ANTHROPIC_API_KEY=              # Claude API 키 (서버 전용)
```

### Supabase 설정

```bash
# Supabase CLI로 마이그레이션 적용
npx supabase db push
```

또는 Supabase 대시보드에서 `supabase/migrations/001_initial_schema.sql`을 직접 실행합니다.

### 개발 서버 실행

```bash
npm run dev        # http://localhost:3000
```

### 기타 명령어

```bash
npm run build      # 프로덕션 빌드
npm run lint       # ESLint 검사
npm run test       # Vitest 테스트 실행
```

---

## 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에서 GitHub 저장소 연결
2. 환경 변수 설정 (위 4개 키)
3. 자동 배포 완료

### CI/CD

GitHub Actions로 자동화된 파이프라인:

```
push/PR → 의존성 설치 → 린트 → 타입 체크 → 테스트 → 빌드 → Vercel 배포
```

---

## 비기능 요구사항

| 항목               | 목표                             |
| ------------------ | -------------------------------- |
| 실시간 메시지 지연 | 500ms 이내                       |
| AI 응답 시간       | 3초 이내                         |
| 반응형 디자인      | 모바일 우선 (375px ~ 1280px+)    |
| 동시 접속          | 방당 최대 8명                    |
| 데이터 보존        | 게임 완료 후 24시간 뒤 자동 삭제 |

---

## 성공 지표 (MVP)

| 지표               | 목표                             |
| ------------------ | -------------------------------- |
| 게임 완료율        | 시작한 방의 70% 이상 게임 완료   |
| 재게임률           | 결과 후 "다시하기" 비율 50% 이상 |
| AI 플레이어 사용률 | 전체 게임의 40% 이상에서 AI 포함 |
| 평균 게임 시간     | 10분 이내                        |

---

## 문서

| 문서        | 경로               | 설명                                                |
| ----------- | ------------------ | --------------------------------------------------- |
| 상세 PRD    | `docs/prd.md`      | MVP 기능 명세, 데이터 모델, AI 연동, 게임 상태 머신 |
| 메타 PRD    | `docs/prd_meta.md` | 린캔버스 정의, PRD 작성 요청 구조                   |
| 로드맵      | `ROADMAP.md`       | 6주 3 Phase 개발 로드맵, 마일스톤                   |
| AI 컨텍스트 | `CLAUDE.md`        | AI 코딩 에이전트용 프로젝트 컨텍스트                |

---

## 라이선스

Private - 사내 프로젝트
