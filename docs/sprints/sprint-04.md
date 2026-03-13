# Sprint 4 — Claude API 연동 + AI 플레이어 통합

> **기간**: 2026-03-14
> **상태**: ✅ 완료
> **목표**: Claude API를 연동하여 AI 플레이어가 설명·토론·투표에 자연스럽게 참여하고, 게임 종료 후 사후 분석을 제공하는 5개 AI 엔드포인트를 구현한다.

---

## 완료 작업

### 1. Claude API 클라이언트 (`lib/ai/claude.ts`)

- `callClaude(options)`: 단일 텍스트 응답 호출. 타임아웃 8초, 실패 시 `null` 반환
- `randomDelay(minMs, maxMs)`: AI 플레이어 자연스러운 딜레이 연출
- 모델: `claude-sonnet-4-6` (한국어 자연스러움 + 속도 최적화)
- 클라이언트 싱글톤 패턴 (서버리스 함수에서 재사용)

### 2. AI 프롬프트 템플릿 (`lib/ai/prompts.ts`)

| 함수 | 역할 |
| --- | --- |
| `keywordsSystemPrompt` + `keywordsPrompt` | 바보 모드 유사 키워드 쌍 생성 |
| `describeSystemPrompt(role)` + `describePrompt(params)` | 역할별 설명 생성 (시민/라이어/바보) |
| `discussSystemPrompt(role)` + `discussPrompt(params)` | 역할별 토론 참여 전략 |
| `voteSystemPrompt(role)` + `votePrompt(params)` | 역할별 투표 결정 |
| `analyzeSystemPrompt` + `analyzePrompt(params)` | 게임 전체 사후 분석 |

### 3. AI API Routes (5개)

| 엔드포인트 | 동작 |
| --- | --- |
| `POST /api/ai/keywords` | 카테고리 → `{keyword, foolKeyword}` JSON 반환. 실패 시 카테고리 키워드 두 개 랜덤 폴백 |
| `POST /api/ai/describe` | 현재 턴 AI 플레이어 설명 생성 → descriptions INSERT → 다음 턴 전환. 딜레이 2~4초 |
| `POST /api/ai/discuss` | 토론 단계 AI 채팅 메시지 생성 → messages INSERT. 딜레이 1.5~3.5초 |
| `POST /api/ai/vote` | 투표 단계 AI 전략적 투표 → votes UPSERT. 전원 완료 시 집계. 딜레이 2~5초 |
| `POST /api/ai/analyze` | 게임 종료 후 사후 분석 → game_analyses INSERT. DB 캐시 (중복 호출 방지) |

### 4. 바보 모드 AI 키워드 연동 (start API 업데이트)

- 게임 시작 시 `mode === "fool"`이면 `/api/ai/keywords` 내부 호출로 AI 키워드 쌍 생성
- AI 실패 시 카테고리 키워드 두 개 랜덤으로 폴백

### 5. AI 턴 자동 트리거 (`hooks/useAiActions.ts`)

방장 클라이언트에서만 AI 액션 트리거 (중복 방지):
- `description` phase: 현재 턴 AI 플레이어 감지 → `/api/ai/describe` 자동 호출
- `discussion` phase: 각 AI가 토론 시간의 1/3, 2/3 지점에 자동 메시지
- `vote` phase: 각 AI가 1.5초 간격으로 순차 투표

`triggeredRef`(Set)로 동일 상태 중복 트리거 방지.

### 6. AI 사후 분석 컴포넌트 (`components/result/AIAnalysis.tsx`)

결과 페이지에 자동으로 표시:
- 컴포넌트 마운트 시 `/api/ai/analyze` 호출 (로딩 상태 표시)
- 분석 섹션: 게임 요약, 의심도 분석(낮음/중간/높음), 핵심 단서, 전략 평가, 다음 게임 팁

---

## 기술적 결정 및 근거

### 폴백 전략: 모든 AI 호출에 폴백 응답

**결정**: AI API 실패(타임아웃, 오류) 시 사전 정의 폴백 텍스트 사용

**근거**: Claude API 일시 장애나 네트워크 문제로 게임이 멈추면 안 됨. 폴백이 있으면 AI 없이도 게임 진행 가능. 사용자는 AI가 응답하지 못했다는 사실을 인지 못함.

### AI 트리거: 방장 클라이언트 단일 호출

**결정**: `isHost` 플레이어의 클라이언트에서만 AI API 호출

**근거**: 서버에 자체 타이머/스케줄러가 없는 Next.js Serverless 환경에서 "누가 트리거하나" 문제 해결. 방장이 나가면 다음 방장이 승계되므로 항상 1명이 트리거 담당.

### DB 캐시: 분석 중복 저장 방지

**결정**: `/api/ai/analyze` 호출 시 `game_analyses` 테이블에 기존 기록 확인 후 있으면 그대로 반환

**근거**: 결과 페이지에서 여러 플레이어가 동시에 컴포넌트를 마운트하면 분석 API가 중복 호출됨. DB 캐시로 한 번만 생성.

### 프롬프트 설계: 역할별 전략 차별화

**결정**: 시민/라이어/바보 각각 다른 시스템 프롬프트 사용

**근거**: 라이어는 "모호하게" 설명하도록, 시민은 자연스럽게 설명하도록 유도. 실제 게임에서 구분이 어렵도록 역할별 전략을 명시적으로 지시.

---

## 트러블슈팅

### 내부 API 호출 URL 구성

- **증상**: start API에서 `/api/ai/keywords`를 내부 호출 시 상대 경로 불가
- **해결**: `req.headers.get("origin") ?? https://${req.headers.get("host")}` 으로 절대 URL 구성

---

## Sprint 4 완료 기준 검증

| 완료 기준 | 결과 |
| --- | --- |
| `npm run build` 에러 없이 성공 | ✅ |
| AI 플레이어가 설명 단계에 자동 참여 | ✅ |
| AI 플레이어가 토론에 자동 참여 | ✅ |
| AI 플레이어가 투표를 전략적으로 수행 | ✅ |
| 바보 모드 AI 키워드 쌍 생성 | ✅ |
| 게임 종료 후 AI 사후 분석 표시 | ✅ |
| Claude API 실패 시 폴백 동작 | ✅ |
| AI 응답 딜레이 (자연스러운 연출) | ✅ |

---

## Sprint 5 준비 사항

**Sprint 5 구현 예정**:
- 타이머 만료 시 자동 phase 전환 (현재 클라이언트 수동 호출)
- 반응형 디자인 (모바일/태블릿 최적화)
- 에러 처리 및 엣지 케이스 (방 코드 오류, 플레이어 이탈)
- `app/error.tsx`, `app/not-found.tsx`
- RoleReveal "전원 확인 후 자동 description 전환" 개선
