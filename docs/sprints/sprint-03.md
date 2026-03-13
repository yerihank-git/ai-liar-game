# Sprint 3 — 게임 상태 머신 + 핵심 플레이 로직

> **기간**: 2026-03-14
> **상태**: ✅ 완료
> **목표**: 게임 시작부터 결과까지 전체 플레이 흐름(역할 배정 → 설명 → 토론 → 투표 → 최후의변론 → 결과)을 구현하고, 실시간으로 동기화되는 게임 E2E를 완성한다.

---

## 완료 작업

### 1. 게임 순수 로직 (`lib/game-logic.ts`)

| 함수 | 역할 |
| --- | --- |
| `assignRoles(players, mode)` | 랜덤 1명 특수 역할(라이어/바보) 배정 |
| `determineTurnOrder(players)` | 설명 순서 랜덤 셔플 |
| `countVotes(votes)` | 최다 득표 집계 + 동점 감지 |
| `judgeClassic(params)` | 기본 모드 승패 판정 (3가지 분기) |
| `judgeFool(params)` | 바보 모드 승패 판정 (2가지 분기) |
| `pickRandomKeyword(keywords)` | 카테고리에서 랜덤 키워드 선택 |
| `getNextTurnPlayerId(order, current)` | 다음 턴 플레이어 id 계산 |

### 2. API Routes 신규 추가 (6개)

| 엔드포인트 | 메서드 | 역할 |
| --- | --- | --- |
| `/api/rooms/[roomId]/start` | POST | 게임 시작: 역할 배정, 키워드 선택, phase → role_reveal |
| `/api/rooms/[roomId]/describe` | POST | 설명 제출 → 다음 턴 or description→discussion 전환 |
| `/api/rooms/[roomId]/vote` | POST | 투표 제출 → 전원 완료 시 집계 → phase 전환 |
| `/api/rooms/[roomId]/guess` | POST | 라이어 정답 제출 → 승패 판정 → result |
| `/api/rooms/[roomId]/next-phase` | POST | 타이머 만료/수동 phase 전환 (전체 상태 머신 커버) |
| `/api/rooms/[roomId]/messages` | POST | 토론 채팅 메시지 전송 |

### 3. `hooks/useTimer.ts`

- `phase_started_at` 서버 시각 기준 카운트다운
- `remainingSec`, `progress(0~1)`, `isExpired` 반환
- 만료 시 `onExpire` 콜백 한 번만 호출 (ref 플래그로 중복 방지)

### 4. `hooks/useRoom.ts` 업데이트

Realtime 구독 확장:
- `descriptions` INSERT → 전체 재조회
- `messages` INSERT → 전체 재조회
- `votes` `*` 이벤트 → 전체 재조회

### 5. 게임 컴포넌트 (`components/game/`)

| 컴포넌트 | 설명 |
| --- | --- |
| `RoleReveal.tsx` | 카드 뒤집기 3D 애니메이션 역할 확인, 확인 완료 버튼 |
| `DescriptionPhase.tsx` | 현재 턴 하이라이트 + 타이머 + 이전 설명 목록 + 입력 필드 |
| `DiscussionPhase.tsx` | 실시간 채팅 UI + 설명 요약 접기/펼치기 + 타이머 |
| `VotePhase.tsx` | 플레이어 선택 버튼 + 투표 현황 표시 + 타이머 |
| `FinalDefense.tsx` | 라이어 정답 입력 + 대기 화면 분기 + 타이머 |

### 6. 결과 컴포넌트 (`components/result/`)

| 컴포넌트 | 설명 |
| --- | --- |
| `ResultBanner.tsx` | 승패 배너 + 개인 승리 여부 표시 |
| `RoleRevealTable.tsx` | 키워드 공개 + 전체 역할 테이블 |
| `VoteVisualization.tsx` | 득표 수 바차트 + 투표자 이름 표시 |
| `ResultPage.tsx` | 결과 전체 조합 + 다시하기/나가기 버튼 |

### 7. `room/[roomId]/page.tsx` 업데이트

7개 phase 모두 실제 컴포넌트와 연결:
- `waiting` → `LobbyPage`
- `role_reveal` → `RoleReveal`
- `description` → `DescriptionPhase`
- `discussion` → `DiscussionPhase`
- `vote` → `VotePhase`
- `final_defense` → `FinalDefense`
- `result` → `ResultPage`

---

## 기술적 결정 및 근거

### 게임 로직 순수 함수 분리

**결정**: 역할 배정, 승패 판정 등 비즈니스 로직을 `lib/game-logic.ts` 순수 함수로 격리

**근거**: API Route와 UI 코드에서 공유 가능, 단위 테스트 작성이 용이 (Sprint 6에서 활용 예정). 서버/클라이언트 양쪽에서 import 가능.

### 동점 처리: 투표 초기화 후 재투표

**결정**: 동점 발생 시 votes 테이블 전체 삭제 후 vote phase 유지

**근거**: 재투표 시나리오를 단순하게 처리. `phase_started_at` 갱신으로 타이머 재시작.

### next-phase API: 단일 엔드포인트로 전체 상태 머신 처리

**결정**: 타이머 만료 처리와 수동 전환을 모두 `next-phase` 단일 API로 통일

**근거**: 클라이언트 코드 단순화. 각 phase에서 만료 시 동일 API 호출로 일관성 유지.

### 역할 공개 (role_reveal) 진행 방식

**결정**: 각 플레이어가 "확인 완료" 버튼으로 next-phase를 호출하는 방식 채택

**근거**: 전원 확인 후 자동 전환보다 구현이 단순하고, 플레이어 제어권 보장. 방장/참가자 모두 버튼 클릭 시 description phase 전환.

---

## 트러블슈팅

### useRoom Realtime 구독 — descriptions/votes 누락

- **증상**: Sprint 2에서 구현된 `useRoom`이 rooms 변경만 구독, 게임 중 설명/투표 변경이 실시간 반영 안 됨
- **해결**: `useRoom` 채널에 `descriptions`/`messages`/`votes` INSERT 구독 추가 + 변경 감지 시 전체 재조회

---

## Sprint 3 완료 기준 검증

| 완료 기준 | 결과 |
| --- | --- |
| `npm run build` 에러 없이 성공 | ✅ |
| 게임 시작 API (역할 배정, 키워드 선택) | ✅ |
| 설명 단계 턴제 진행 | ✅ |
| 투표 단계 + 집계 + 동점 처리 | ✅ |
| 최후의 변론 + 정답 판정 | ✅ |
| 결과 페이지 (역할 공개, 투표 시각화) | ✅ |
| 다시하기 (같은 방 waiting으로 복귀) | ✅ |
| 타이머 만료 자동 phase 전환 | ✅ |
| 7개 phase 전체 컴포넌트 연결 | ✅ |

---

## Sprint 4 준비 사항

**Sprint 4 구현 예정**:
- `lib/ai/claude.ts`: Claude API 클라이언트 + 공통 호출 함수
- `lib/ai/prompts.ts`: 역할별/기능별 프롬프트 템플릿
- `POST /api/ai/keywords`: 바보 모드 AI 키워드 쌍 생성
- `POST /api/ai/describe`: AI 플레이어 설명 자동 생성
- `POST /api/ai/discuss`: AI 토론 메시지 자동 생성
- `POST /api/ai/vote`: AI 전략적 투표
- `POST /api/ai/analyze`: 게임 종료 후 AI 사후 분석
- `components/result/AIAnalysis.tsx`: 분석 결과 렌더링
