# Sprint 7 — 코드 품질 개선 + UX 개선 + 문서 보완

> **기간**: 2026-03-16
> **상태**: ✅ 완료
> **목표**: 아키텍처 취약점(동시성 제어, 에러 처리)을 보완하고, 사용자 경험(타이머 시각화, 로딩 상태, 에러 피드백, AI 응답 피드백)을 개선한다. 문서화 체계(README, ROADMAP, CLAUDE.md)도 보완한다.

---

## 완료 작업

### 1. 동시성 제어 (Race Condition 수정)

#### `useAiActions.ts` — setTimeout cleanup

**문제**: `discussion` phase에서 등록된 `setTimeout`이 phase가 `vote`로 전환된 후에도 취소되지 않아, 이미 끝난 토론 단계에 AI 메시지 요청이 발생할 수 있었음.

**해결**: `timerIdsRef`에 setTimeout ID를 저장하고 useEffect cleanup에서 `clearTimeout`으로 일괄 취소.

```ts
const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
// ...
return () => {
  timerIdsRef.current.forEach(clearTimeout);
  timerIdsRef.current = [];
};
```

#### `next-phase/route.ts` — 낙관적 잠금 (Optimistic Locking)

**문제**: 여러 클라이언트가 동시에 phase 전환 API를 호출하면 같은 phase update가 두 번 실행되어 의도치 않은 상태 전환이 발생할 수 있었음.

**해결**: 모든 phase 전환 update에 `.eq("phase", 현재_phase)` 조건 추가. DB 레벨에서 현재 phase와 일치할 때만 update가 반영되므로, 두 번째 요청은 no-op이 됨.

```ts
await supabase.from("rooms")
  .update({ phase: "description", phase_started_at: now })
  .eq("id", roomId)
  .eq("phase", "role_reveal"); // 낙관적 잠금
```

#### `ai/analyze/route.ts` — 중복 insert 처리

**문제**: 결과 페이지 진입 시 여러 클라이언트가 동시에 `/api/ai/analyze`를 호출하면 두 요청이 모두 `existing` 체크를 통과한 뒤 중복 insert를 시도하는 TOCTOU(Time-Of-Check-Time-Of-Use) race condition 발생.

**해결**: insert 실패(중복 에러) 시 이미 저장된 데이터를 조회해서 반환하는 fallback 처리 추가.

```ts
const { error: insertError } = await supabase.from("game_analyses").insert({ ... });
if (insertError) {
  const { data: saved } = await supabase.from("game_analyses")
    .select("analysis_content").eq("room_id", roomId).single();
  return NextResponse.json({ analysis: saved?.analysis_content ?? analysis });
}
```

---

### 2. 에러 처리 강화

#### `lib/ai/claude.ts` — 에러 로깅

catch에서 모든 에러를 조용히 삼키던 패턴을 `console.error`로 교체하여 운영 중 AI 호출 실패 원인 추적 가능.

```ts
} catch (err) {
  console.error("[callClaude] error:", err instanceof Error ? err.message : String(err));
  return null;
}
```

#### `ai/describe/route.ts`, `ai/discuss/route.ts` — DB 에러 감지

AI 설명/토론 메시지의 DB insert·update 실패를 감지하지 못하던 문제 수정. 실패 시 500 응답 반환 + 로깅.

#### `useAiActions.ts` — silent fail 제거

`fetch().catch(() => {})` 패턴으로 모든 AI API 오류를 묵살하던 것을 `console.error` 로깅으로 교체.

---

### 3. 컴포넌트 테스트 추가

**파일**: `src/components/result/ResultBanner.test.tsx`

`ResultBanner` 컴포넌트에 대한 6개 테스트 추가:

| 테스트 케이스 | 검증 내용 |
| --- | --- |
| result null | 아무것도 렌더링되지 않음 |
| 시민 승리 + 시민 플레이어 | "시민 승리", "🎉 승리!" 표시 |
| 시민 승리 + 라이어 플레이어 | "시민 승리", "😔 패배" 표시 |
| 라이어 역전 승리 | 키워드 포함 텍스트 + "🎉 승리!" 표시 |
| 바보 승리 + 바보 플레이어 | "바보 승리", "🎉 승리!" 표시 |
| AI 플레이어 | 승패 배지 미표시 |

**실행 결과**: 64/64 테스트 통과 (기존 58 + 신규 6)

---

### 4. UX 개선

#### 타이머 시각화 — 전 단계 프로그레스 바

| 컴포넌트 | 이전 | 이후 |
| --- | --- | --- |
| `DescriptionPhase` | 내 턴에만 `w-20 h-1` 작은 바 | 모든 플레이어에게 전체 너비 `h-1.5` 바 |
| `DiscussionPhase` | 프로그레스 바 없음, 숫자만 | 전체 너비 프로그레스 바 추가 |
| `VotePhase` | `w-16 h-1` 작은 바 | 전체 너비 `h-1.5` 바로 교체 |

모든 프로그레스 바에 `transition-all duration-500` 적용으로 부드러운 감소 애니메이션 적용. 잔여 시간에 따라 색상 변화(초록 → 노랑 → 빨강).

#### AI 응답 딜레이 피드백 — "AI가 생각 중..." 인디케이터

AI 플레이어 턴 대기 시 기존 단순 텍스트에서, 점 3개 바운스 애니메이션 + teal 색상 텍스트로 AI가 응답을 생성 중임을 명확히 표시.

```tsx
{[0, 1, 2].map((i) => (
  <div className="w-1.5 h-1.5 rounded-full animate-bounce"
    style={{ animationDelay: `${i * 150}ms` }} />
))}
<p>ARIA AI가 생각 중...</p>
```

#### 에러 메시지 친화성

- `DescriptionPhase`: 설명 제출 실패 시 인라인 에러 메시지 표시
- `VotePhase`: 투표 실패 시 인라인 에러 메시지 표시
- 네트워크 오류와 서버 오류를 구분하여 안내

#### 로딩 상태 개선

`LoadingScreen` 컴포넌트를 단순 텍스트에서 스피너 애니메이션 + 텍스트 조합으로 개선.

투표 완료 후 대기 중 상태에도 스피너 인디케이터 추가.

---

### 5. 문서 보완

#### `README.md`
- 상단 "라이브 데모" 섹션 추가: `https://ai-liar-game.vercel.app`
- "구현 완료 현황" 표 추가: F001~F017 완료 상태 + 백로그 항목 명확히 구분

#### `ROADMAP.md`
- 대시보드: MVP 완료 + 프로덕션 배포 완료 상태로 업데이트
- 마일스톤 7개 모두 `✅ 완료` + 실제 완료일 반영
- 향후 계획 섹션: "MVP(F001~F017) 범위 외 기능" 명시 — 백로그 항목을 미구현 MVP로 오해하지 않도록 구분

#### `CLAUDE.md`
- Git 컨벤션 강화: 커밋 메시지에 `why(변경 이유)` 포함 원칙 + 형식 가이드 + 나쁜 예/좋은 예 대비

---

## 기술적 결정 및 근거

### 낙관적 잠금 vs. 비관적 잠금

**결정**: `next-phase/route.ts`에서 `.eq("phase", 현재_phase)` 조건을 통한 낙관적 잠금 선택.

**근거**: 비관적 잠금(DB row lock)은 Supabase PostgREST API에서 직접 지원이 어렵고, 게임 특성상 동시 요청 충돌 빈도가 낮아 낙관적 잠금으로 충분. 첫 번째 요청이 성공하면 두 번째는 조건 불일치로 no-op이 되어 멱등성 보장.

### 컴포넌트 테스트 전략: 순수 렌더링 컴포넌트 우선

**결정**: `ResultBanner`처럼 외부 의존성(API 호출, Supabase)이 없는 순수 렌더링 컴포넌트부터 테스트.

**근거**: 외부 의존성이 있는 컴포넌트(DescriptionPhase 등)는 모킹 비용이 높음. `ResultBanner`는 props만으로 렌더링이 결정되어 테스트 신뢰도가 높음. 승패 표시 로직의 버그는 게임 종료 시점 사용자 경험에 직접 영향을 주므로 테스트 가치가 높음.

---

## 트러블슈팅

### `discuss/route.ts` Edit 도구 "파일을 먼저 읽지 않음" 오류

- **증상**: Edit 도구가 "File has not been read yet" 에러 반환
- **원인**: 이전에 에이전트 도구로 파일 내용을 읽었지만 메인 컨텍스트에서 Read 도구로 직접 읽지 않은 상태에서 Edit 시도
- **해결**: Read 도구로 파일 하단 확인 후 Edit 재시도

---

## Sprint 7 완료 기준 검증

| 완료 기준 | 결과 |
| --- | --- |
| race condition 3건 수정 (setTimeout, 낙관적 잠금, 중복 insert) | ✅ |
| AI route DB 에러 처리 추가 (describe, discuss) | ✅ |
| callClaude 에러 로깅 추가 | ✅ |
| ResultBanner 컴포넌트 테스트 6개 추가 | ✅ |
| 전 게임 단계 타이머 프로그레스 바 통일 | ✅ |
| AI 생각 중 인디케이터 추가 | ✅ |
| 에러 메시지 (설명 제출, 투표) 추가 | ✅ |
| LoadingScreen 스피너 개선 | ✅ |
| README 배포 URL + 구현 현황 표 추가 | ✅ |
| ROADMAP 마일스톤 완료 상태 반영 | ✅ |
| CLAUDE.md 커밋 컨벤션 강화 | ✅ |
| `npm test` 64개 테스트 전부 통과 | ✅ |
| `npm run build` 에러 없이 성공 | ✅ |
