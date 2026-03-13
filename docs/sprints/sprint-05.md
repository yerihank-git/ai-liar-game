# Sprint 5 — 완성도 + 반응형 + 에러 처리

> **기간**: 2026-03-14
> **상태**: ✅ 완료
> **목표**: 게임 흐름의 자동 phase 전환 버그를 수정하고, 반응형 디자인(모바일/태블릿)을 적용하며, 에러 처리 페이지를 구현하여 완성도를 높인다.

---

## 완료 작업

### 1. RoleReveal 전원 확인 자동 전환 수정

**파일**: `src/app/api/rooms/[roomId]/confirm-role/route.ts` (신규)

- **기존 문제**: 각 플레이어가 "확인 완료"를 누를 때마다 `next-phase` API를 호출 → 첫 번째 클릭에 바로 description으로 전환되는 버그
- **수정 방식**: `confirm-role` 전용 API 생성
  - 개인 `role_confirmed = true` 업데이트
  - 전원 `role_confirmed` 여부 확인 후 `description` 전환
  - Realtime으로 플레이어 상태 변경이 모든 클라이언트에 동기화됨

**파일**: `src/components/game/RoleReveal.tsx`
- `useTimer` 의존성 제거 (역할 확인 단계에 타이머 불필요)
- 카드 크기 반응형 (`w-56 h-72 sm:w-64 sm:h-80`)
- 확인 완료 진행 상황 메시지 개선: "확인 완료: N/M명 · 전원 확인 시 자동 시작"

### 2. 토론 단계 타이머 만료 자동 phase 전환

**파일**: `src/components/game/DiscussionPhase.tsx`
- `isHost` prop 추가
- 타이머 만료 시 `isHost` 클라이언트에서만 `next-phase` API 호출 (중복 방지)
- `useCallback`으로 onExpire 안정화

### 3. 반응형 디자인 적용

**room/[roomId]/page.tsx**: 각 phase별 최적 너비 컨테이너 적용
| Phase | 컨테이너 |
| --- | --- |
| role_reveal | `max-w-2xl` |
| description | `max-w-2xl` |
| discussion | `max-w-2xl` |
| vote | `max-w-xl` |
| final_defense | `max-w-xl` |
| result | `max-w-2xl` |

**LobbyPage**: `px-4 py-4 lg:px-6 lg:py-6` 패딩 반응형

**DiscussionPhase**: 높이 `calc(100dvh - 160px)` (dynamic viewport height, 모바일 주소창 대응)

**globals.css 모바일 최적화**:
- `-webkit-tap-highlight-color: transparent` — iOS 터치 하이라이트 제거
- `overscroll-behavior: none` — 브라우저 풀-투-리프레시 방지
- `padding-bottom: env(safe-area-inset-bottom)` — 홈 인디케이터 영역 대응

### 4. 에러 처리 페이지

**`app/error.tsx`** — 글로벌 에러 바운더리
- 오류 다이제스트 표시
- "다시 시도" / "홈으로" 버튼

**`app/not-found.tsx`** — 404 페이지
- 게임 테마 404 표시
- "홈으로 돌아가기" 링크

---

## 기술적 결정 및 근거

### confirm-role: 전용 API 분리

**결정**: `next-phase` API를 재사용하지 않고 `confirm-role` 전용 API 생성

**근거**: `next-phase`는 방장 검증이 포함되어 있어 참가자가 호출할 수 없음. 역할 확인은 모든 플레이어가 개별적으로 수행해야 하므로 전용 엔드포인트가 필요. DB 레벨에서 마지막 확인자가 phase 전환을 트리거하는 방식이 경합 조건에 안전.

### 100dvh: dynamic viewport height

**결정**: DiscussionPhase 높이에 `100dvh` 사용

**근거**: 모바일에서 `100vh`는 주소창 포함 높이로 계산되어 실제 가용 높이보다 큼. `100dvh`는 현재 실제 가용 뷰포트 높이를 반영.

---

## 트러블슈팅

### not-found.tsx에서 Button asChild 타입 오류

- **증상**: `<Button asChild>` — shadcn v4(`@base-ui/react`)는 `asChild` prop 미지원
- **해결**: `<Button>` 제거, 직접 styled `<Link>` 사용 (inline style)
- **패턴**: Sprint 1에서도 동일하게 확인된 shadcn v4 제약 사항

---

## Sprint 5 완료 기준 검증

| 완료 기준 | 결과 |
| --- | --- |
| `npm run build` 에러 없이 성공 | ✅ |
| RoleReveal 전원 확인 후 자동 description 전환 | ✅ |
| 토론 타이머 만료 시 자동 vote 전환 (방장 단독) | ✅ |
| 모바일(375px) 레이아웃 정상 표시 | ✅ |
| 에러 바운더리 페이지 | ✅ |
| 404 페이지 | ✅ |
| iOS safe area 대응 | ✅ |

---

## Sprint 6 준비 사항

**Sprint 6 구현 예정**:
- `lib/game-logic.test.ts`: 게임 로직 단위 테스트 (Vitest)
- `.github/workflows/ci.yml`: lint → typecheck → build CI
- `.github/workflows/deploy.yml`: Vercel 자동 배포
- Vercel 프로덕션 배포 + 환경 변수 설정
- README.md 업데이트 (배포 URL, 설치/실행 가이드)
