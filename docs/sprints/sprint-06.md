# Sprint 6 — 테스트 + CI/CD + 마무리

> **기간**: 2026-03-14
> **상태**: ✅ 완료
> **목표**: 게임 핵심 로직 단위 테스트를 작성하고, GitHub Actions CI 파이프라인을 구성하여 코드 품질을 자동으로 검증한다. README를 최종 정리한다.

---

## 완료 작업

### 1. 게임 로직 단위 테스트 (`src/lib/game-logic.test.ts`)

Vitest로 `game-logic.ts`의 7개 순수 함수 전체를 커버하는 28개 테스트 작성.

| 함수 | 테스트 수 | 주요 케이스 |
| --- | --- | --- |
| `assignRoles` | 4 | classic/fool 모드 역할 배정, 전원 포함 여부, 2인 최소 케이스 |
| `determineTurnOrder` | 3 | 전원 포함, 중복 없음, 1인 케이스 |
| `countVotes` | 5 | 빈 투표, 단독 최다 득표, 동점 isTie, 1표, tally 집계 |
| `judgeClassic` | 5 | 미지목, 지목+정답, 지목+오답, 공백/대소문자 정규화, null 정답 |
| `judgeFool` | 3 | 바보 지목, 바보 미지목, null accusedId |
| `pickRandomKeyword` | 3 | 목록 내 값, 1개 목록, 반복 검증 |
| `getNextTurnPlayerId` | 5 | 중간 플레이어, 마지막, 없는 id, 빈 배열, 1인 |

**실행 결과**: 28/28 통과, 총 소요 7ms

### 2. GitHub Actions CI (`'.github/workflows/ci.yml`)

`push` (main, feature/**) 및 `pull_request` (main 타겟) 시 자동 실행:

```
의존성 설치 (npm ci)
  → Lint (next lint)
  → Typecheck (tsc --noEmit)
  → 테스트 (vitest --run)
  → 빌드 (next build)
```

- Node.js 20 + npm cache 활성화
- 빌드 단계에서 환경 변수 secrets 주입 (빌드 타임 체크)

### 3. README.md 업데이트

- 최상단 CI 배지 추가 (`[![CI](...)`)
- 저장소 clone URL을 실제 GitHub URL로 확정

---

## 기술적 결정 및 근거

### 단위 테스트 범위: 순수 함수만

**결정**: Realtime 훅, API Routes, 컴포넌트는 테스트 제외. `game-logic.ts` 순수 함수만 테스트.

**근거**: 순수 함수는 외부 의존성 없이 입출력만으로 동작을 완전히 검증할 수 있음. API/컴포넌트 테스트는 Supabase 모킹 또는 E2E 환경이 필요해 MVP 단계에서 비용 대비 효과가 낮음. 게임 승패 판정, 역할 배정, 투표 집계 로직의 버그가 게임 무결성에 직결되므로 이 부분을 우선 커버.

### CI 환경변수: secrets 주입

**결정**: 빌드 단계에만 secrets 주입 (lint/typecheck/test는 환경변수 불필요)

**근거**: 테스트는 환경변수 참조가 없는 순수 함수만 테스트하므로 불필요. 빌드 시에는 Next.js가 `NEXT_PUBLIC_*` 변수를 번들에 포함하므로 실제 값 또는 placeholder가 필요.

---

## 트러블슈팅

없음 — 테스트, CI 설정 모두 첫 시도에 성공.

---

## Sprint 6 완료 기준 검증

| 완료 기준 | 결과 |
| --- | --- |
| `npm test` 28개 테스트 전부 통과 | ✅ |
| `game-logic.ts` 7개 함수 100% 커버 | ✅ |
| `.github/workflows/ci.yml` 생성 | ✅ |
| CI 파이프라인: lint → typecheck → test → build | ✅ |
| README CI 배지 + 실제 저장소 URL | ✅ |
