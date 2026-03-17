# Sprint 2 — 대기실 UI + Zustand 스토어 + Realtime 훅

> **기간**: 2026-03-14
> **상태**: ✅ 완료
> **목표**: Zustand 스토어와 Supabase Realtime 훅을 구축하고, 대기실 UI(플레이어 목록, 초대 링크, 게임 설정, AI 추가/제거)를 완성하여 실시간으로 동기화되는 대기실을 구현한다.

---

## 완료 작업

### 1. Zustand 스토어

**파일**: `src/store/player-store.ts`, `src/store/game-store.ts`

- `player-store`: 현재 플레이어 세션 (playerId, sessionToken, nickname, roomId) — `persist` 미들웨어로 localStorage 영속화
- `game-store`: 방 정보, 플레이어 목록, 설명, 채팅 메시지, 투표 상태 — 전체 게임 데이터 중앙 관리

### 2. Supabase Realtime 훅

**파일**: `src/hooks/useRoom.ts`, `src/hooks/usePlayers.ts`, `src/hooks/usePresence.ts`

| 훅            | 구독 대상           | 동작                                                       |
| ------------- | ------------------- | ---------------------------------------------------------- |
| `useRoom`     | rooms UPDATE        | room 상태 업데이트 + descriptions/messages/votes 초기 로드 |
| `usePlayers`  | players 전체 이벤트 | 변경 감지 시 전체 재조회                                   |
| `usePresence` | Supabase Presence   | 플레이어 온/오프라인 상태 실시간 추적                      |

### 3. 대기실 컴포넌트

**파일**: `src/components/lobby/`

- `PlayerList.tsx`: 플레이어 목록 (방장 왕관, AI 뱃지, 온라인 상태 점, 나(나) 표시)
- `InviteLink.tsx`: 초대 링크 + 방 코드 표시, 클립보드 복사 버튼 (복사 후 2초 피드백)
- `GameSettings.tsx`: 모드 토글, 카테고리 선택, AI 플레이어 수 조절, 타이머 설정 (접기/펼치기)
- `LobbyPage.tsx`: 대기실 전체 레이아웃 — 방장/참가자 권한 분리 렌더링

### 4. API Routes 추가

**파일**: `src/app/api/rooms/[roomId]/settings/route.ts`

- `PATCH /api/rooms/[roomId]/settings`: 게임 설정 업데이트 (방장 검증, 유효값 검증)

**파일**: `src/app/api/rooms/[roomId]/ai-players/route.ts`

- `POST /api/rooms/[roomId]/ai-players`: AI 플레이어 추가 (닉네임 BYEUB→MEDIAI 순 자동 배정)
- `DELETE /api/rooms/[roomId]/ai-players`: AI 플레이어 제거 (최근 추가 순)

### 5. 게임 페이지 업데이트

**파일**: `src/app/room/[roomId]/page.tsx`

- Zustand `player-store` + localStorage fallback 병행 hydration 처리
- `useRoom`, `usePlayers` 훅 연결
- `waiting` phase → `LobbyPage` 렌더링
- 나머지 phase → Sprint 3 플레이스홀더

---

## 기술적 결정 및 근거

### Zustand persist: localStorage 키 통일

**결정**: Zustand persist name을 기존 `localStorage.setItem("playerSession", ...)` 키와 동일하게 설정

**근거**: Sprint 1에서 수동으로 저장하던 세션을 Zustand가 같은 키로 읽도록 하여 하위 호환성 유지. 별도 마이그레이션 코드 불필요.

### usePresence: Supabase Presence key = playerId

**결정**: Presence 채널 key를 `playerId`로 설정

**근거**: 동일 플레이어가 여러 탭에서 접속해도 동일 key로 합산되어 중복 표시 방지. `presenceState[playerId]` 배열로 다중 연결 자연스럽게 처리.

### 방장/참가자 권한 UI 분리

**결정**: `LobbyPage`에서 `isHost` 여부에 따라 GameSettings(방장) vs 게임 정보 요약(참가자) 중 하나 렌더링

**근거**: 참가자가 설정을 볼 수만 있고 변경은 할 수 없도록 명확히 분리. API에서도 방장 검증으로 이중 보호.

---

## 트러블슈팅

### Zustand persist + Next.js SSR hydration 불일치

- **증상**: 서버에서 `null`인 세션이 클라이언트에서 복원되기 전 렌더링되어 `/`로 리다이렉트
- **해결**: `hydrated` state로 useEffect 이후에만 세션 접근. Zustand persist는 클라이언트 전용임을 명시

---

## Sprint 2 완료 기준 검증

| 완료 기준                              | 결과 |
| -------------------------------------- | ---- |
| `npm run build` 에러 없이 성공         | ✅   |
| 대기실 UI 렌더링 (방장/참가자 분리)    | ✅   |
| 플레이어 목록 Realtime 구독            | ✅   |
| 초대 링크 복사 기능                    | ✅   |
| 게임 설정 API (모드, 카테고리, 타이머) | ✅   |
| AI 플레이어 추가/제거 API              | ✅   |
| Zustand 스토어 세션 영속화             | ✅   |

---

## Sprint 3 준비 사항

**Sprint 3 구현 예정**:

- `POST /api/rooms/[roomId]/start`: 게임 시작 API (역할 배정, 키워드 선택, phase 전환)
- `lib/game-logic.ts`: 역할 배정, 턴 순서 결정, 승패 판정 순수 함수
- RoleReveal, DescriptionPhase, VotePhase, FinalDefense, Result 컴포넌트
- `POST /api/rooms/[roomId]/describe`, `vote`, `guess`, `next-phase` API Routes
