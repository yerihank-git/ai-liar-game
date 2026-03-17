# Sprint 8 — 게임 품질 개선: AI 튜닝 + UX 개선 + 버그 수정

> **기간**: 2026-03-17
> **상태**: ✅ 완료
> **목표**: AI 응답 품질을 높이고, 게임 흐름의 UX를 개선하며, 누적된 버그를 수정한다. 카테고리 키워드 확장과 BGM 추가로 게임 완성도를 높인다.

---

## 완료 작업

### 1. AI 모델 교체 및 프롬프트 전면 개선

#### `lib/ai/claude.ts` — 모델 및 설정 변경

| 항목 | 이전 | 이후 |
| --- | --- | --- |
| 모델 | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` |
| MAX_TOKENS | 300 | 600 |
| TIMEOUT_MS | 8,000ms | 10,000ms |

**근거**: AI 플레이어 응답에 Sonnet은 비용 대비 과도한 성능. Haiku로 교체 시 응답 지연 감소 + 비용 절감. 토큰 한도는 분석 품질을 위해 확대.

#### `lib/ai/prompts.ts` — 프롬프트 반말 강제 및 전략 고도화

**이전**: 존댓말, 모호한 지시
**이후**: 반말 강제 (`반드시 반말로 말해. 존댓말 절대 금지.`), 역할별 구체 전략 부여

역할별 변경 내용:

| 역할 | 이전 전략 | 이후 전략 |
| --- | --- | --- |
| 시민 | 간접 표현 섞기 | 비유·감각적 묘사·연상 이미지로 전달, 모호한 표현 금지 |
| 라이어 | 모호하게 설명 | 앞 설명의 공통 테마 추론 → 다른 표현으로 위장 |
| 바보 | 자신의 키워드 설명 | 자기 키워드가 맞다 믿고 구체적으로 표현 |

`describePrompt`에 라이어 전용 힌트 문구 추가 — 이전 설명이 있을 때만 "공통된 테마나 감각을 찾아서 다른 표현으로 말해" 안내.

---

### 2. 카테고리 키워드 대폭 확장

**파일**: `src/constants/categories.ts`

모든 카테고리의 키워드를 약 20개에서 35~40개로 2배 확장. 반복 게임 시 키워드 중복 확률 감소.

| 카테고리 | 이전 | 이후 |
| --- | --- | --- |
| 음식 | 20개 | 38개 |
| 동물 | 20개 | 40개 |
| 장소 | 20개 | 39개 |
| 직업 | 20개 | 38개 |
| 스포츠 | 20개 | 34개 |
| 영화/드라마 → **영화장르** | 20개 | 34개 |
| 나라/도시 | 20개 | 37개 |
| 사물 | 20개 | 36개 |
| 연예인/캐릭터 → **캐릭터** | 20개 | 40개 |
| 자연/날씨 | 20개 | 36개 |

카테고리명도 일부 수정 (`영화/드라마` → `영화장르`, `연예인/캐릭터` → `캐릭터`).

---

### 3. 게임 설정 기본값 조정

**파일**: `src/constants/game-config.ts`

| 항목 | 이전 | 이후 | 이유 |
| --- | --- | --- | --- |
| 기본 설명 타이머 | 60초 | 30초 | 실제 플레이 시 60초는 과도하게 길었음 |
| 기본 토론 타이머 | 120초 | 60초 | 토론이 빨리 수렴하는 경향 |
| 기본 투표 타이머 | 30초 | 15초 | 즉각 투표 가능 |
| 기본 최후변론 타이머 | 30초 | 15초 | 동일 이유 |
| 최후변론 옵션 | [30, 60] | [15, 30] | 기본값에 맞게 조정 |
| AI 닉네임 | ARIA, NOVA | BYEUB, MEDIAI | 닉네임 변경 |

---

### 4. 버그 수정

#### `start/route.ts` — 카테고리 ID 매칭 오류 수정

**문제**: 게임 시작 시 `CATEGORIES.find((c) => c.name === category)`로 카테고리를 조회하고 있었으나, DB에는 `category` 컬럼에 `id`가 저장됨. `name`으로 비교 시 항상 첫 번째 카테고리로 fallback되는 버그.

**해결**: `c.name === category` → `c.id === category`로 수정. 기본값도 `CATEGORIES[0].name` → `CATEGORIES[0].id`로 통일.

```ts
// 이전
const category = room.category ?? CATEGORIES[0].name;
const categoryData = CATEGORIES.find((c) => c.name === category) ?? CATEGORIES[0];

// 이후
const category = room.category ?? CATEGORIES[0].id;
const categoryData = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];
```

#### `usePlayers.ts` — DELETE 이벤트 실시간 구독 오류 수정

**문제**: Supabase Realtime에서 `DELETE` 이벤트는 `REPLICA IDENTITY DEFAULT` 환경에서 column filter(`room_id=eq.*`)가 동작하지 않아 AI 제거 시 UI가 업데이트되지 않는 문제.

**해결**: INSERT/UPDATE는 filter 적용, DELETE는 filter 없이 별도 구독 채널로 분리. `refetch` 함수를 외부에 노출(`return { players, refetch }`)하여 필요 시 수동 갱신 가능.

```ts
.on("postgres_changes",
  { event: "INSERT", ..., filter: `room_id=eq.${roomId}` }, refetch)
.on("postgres_changes",
  { event: "UPDATE", ..., filter: `room_id=eq.${roomId}` }, refetch)
.on("postgres_changes",
  { event: "DELETE", schema: "public", table: "players" }, refetch) // filter 없음
```

#### `room/[roomId]/page.tsx` — Zustand hydration 타이밍 오류 수정

**문제**: `useEffect`에서 `hydrated` 플래그를 단순 `setHydrated(true)`로 설정해 hydration 전에 세션을 판단하여 의도치 않게 `/`로 리다이렉트되는 Race Condition.

**해결**: `usePlayerStore.persist.hasHydrated()`로 즉시 상태 체크 → `onFinishHydration` 콜백으로 완료 시 트리거. Hydration 완료 전에는 세션 판단을 보류.

```ts
const [zustandReady, setZustandReady] = useState(
  () => usePlayerStore.persist?.hasHydrated() ?? false
);

useEffect(() => {
  if (zustandReady) return;
  return usePlayerStore.persist?.onFinishHydration(() => setZustandReady(true));
}, [zustandReady]);
```

---

### 5. 링크 공유 입장 기능

**파일**: `src/app/page.tsx`, `src/components/home/JoinRoomDialog.tsx`

방 초대 링크(`?join=ROOMCODE`)를 통해 홈 접속 시 자동으로 "코드 입장" 다이얼로그가 열리고, 방 코드가 자동 입력되는 기능 추가.

```tsx
// page.tsx
const joinCode = searchParams.get("join")?.toUpperCase() ?? undefined;
<JoinRoomDialog initialRoomCode={joinCode} defaultOpen={!!joinCode}>
```

`useSearchParams`를 사용하므로 `Suspense`로 래핑하여 Next.js 빌드 오류 방지.

---

### 6. 로비 UX 개선

#### `LobbyPage.tsx` — AI 추가/제거 Optimistic Update

AI 추가/제거 시 기존에는 Realtime 구독으로 반영될 때까지 UI 변화가 없어 느리게 느껴졌음. `optimisticAiCount` 상태를 도입하여 즉시 UI에 반영하고, Realtime으로 실제 값이 도달하면 optimistic 상태 해제.

```ts
// 즉시 로컬 상태 반영
const prev = room;
setRoom({ ...room, ...body } as Room);
// 실패 시 롤백
setRoom(prev as Room);
```

#### `GameSettings.tsx` — AI 추가/제거 버튼 텍스트 추가

아이콘만 있던 AI 추가/제거 버튼에 "추가"/"제외" 텍스트 추가하여 직관성 개선. AI 요청 대기 중 버튼 비활성화(`isAiPending` prop).

#### 카테고리 이름 표시 통일

`LobbyPage`, `RoleRevealTable`에서 DB에 저장된 카테고리 `id`를 한국어 `name`으로 변환하는 `getCategoryName` 헬퍼 적용. 기존에는 `id` 그대로 표시되는 문제 있었음.

---

### 7. BGM 추가

**파일**: `src/components/layout/BgmPlayer.tsx` (신규), `src/app/layout.tsx`

게임 배경음악 컴포넌트 추가. 브라우저 autoplay 정책 대응을 위해 첫 사용자 인터랙션(클릭/키입력/터치) 시 재생 시작. 화면 우하단에 음소거/재생 토글 버튼 표시.

```tsx
// 첫 인터랙션 시 재생
window.addEventListener("click", start, { once: true });
window.addEventListener("keydown", start, { once: true });
window.addEventListener("touchstart", start, { once: true });
```

---

### 8. UI 디테일 개선

- **`DiscussionPhase.tsx`**: 토론 단계 헤더 문구 변경 (`"누가 라이어일까요?"` → `"라이어를 맞추기 위해 자유롭게 묻고 답변하세요."`)
- **`FinalDefense.tsx`**: `getCategoryById` 임포트 추가로 카테고리 정보 표시 개선
- **`globals.css`**: glitch 애니메이션 속도 단축 (`3s` → `1.5s`) — 라이어 텍스트가 더 긴박하게 느껴지도록

---

## 기술적 결정 및 근거

### AI 모델 Sonnet → Haiku 전환

**결정**: 게임 내 AI 행동(설명·토론·투표)에 `claude-haiku-4-5-20251001` 사용.

**근거**: AI 플레이어 행동은 짧은 자연어 생성 작업으로 Sonnet의 고성능이 필요하지 않음. Haiku는 응답 속도가 빠르고 비용이 낮아 실시간 게임 환경에 더 적합. 분석(`/api/ai/analyze`)은 여전히 기존 모델 유지 가능.

### Optimistic Update 패턴

**결정**: AI 추가/제거 시 API 응답을 기다리지 않고 로컬 상태를 즉시 업데이트.

**근거**: AI 추가는 체감 응답이 중요한 UX 포인트. Realtime 구독으로 실제 DB 변경이 전파되면 optimistic 상태를 해제하므로 일관성 보장. 실패 시 이전 상태로 롤백.

### Zustand `onFinishHydration` 사용

**결정**: `useEffect`에서 단순 boolean 플래그 대신 `persist.onFinishHydration` API 활용.

**근거**: Zustand persist의 hydration 완료 시점을 정확히 감지할 수 있어 Race Condition 제거. `hasHydrated()`로 이미 완료된 경우 즉시 처리 가능.

---

## 트러블슈팅

### 카테고리 항상 "음식"으로 선택되는 버그

- **증상**: 어떤 카테고리를 선택해도 게임 시작 시 키워드가 항상 "음식" 카테고리에서 나옴
- **원인**: DB에 카테고리 `id`(`"food"`)가 저장되는데 `name`(`"음식"`)으로 비교
- **해결**: `start/route.ts`에서 `.name` → `.id` 비교로 수정

### AI 제거 후 플레이어 목록 미업데이트

- **증상**: AI 제거 API 성공 후 로비 플레이어 목록이 실시간으로 갱신되지 않음
- **원인**: Supabase Realtime의 DELETE 이벤트에 column filter 미동작
- **해결**: DELETE 이벤트를 filter 없이 별도 구독, `refetch` 노출로 로비에서 수동 트리거

---

## Sprint 8 완료 기준 검증

| 완료 기준 | 결과 |
| --- | --- |
| AI 모델 Haiku 교체 | ✅ |
| AI 프롬프트 반말 강제 + 역할별 전략 개선 | ✅ |
| 카테고리 키워드 2배 확장 (모든 카테고리) | ✅ |
| 게임 타이머 기본값 단축 | ✅ |
| 카테고리 ID 매칭 버그 수정 | ✅ |
| Realtime DELETE 이벤트 구독 버그 수정 | ✅ |
| Zustand hydration race condition 수정 | ✅ |
| 링크 공유 자동 입장 다이얼로그 | ✅ |
| 로비 AI 추가/제거 Optimistic Update | ✅ |
| BGM 플레이어 컴포넌트 추가 | ✅ |
| `npm run build` 에러 없이 성공 | ✅ |
