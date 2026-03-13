# 개발 진행 기록 — LiarGame AI

> Sprint별 개발 과정, 기술적 결정, 트러블슈팅을 기록합니다.
> 각 Sprint는 개별 파일로 관리됩니다.

---

## Sprint 목록

| Sprint | 기간 | 주요 내용 | 상태 |
| ------ | ---- | --------- | ---- |
| [Sprint 1](./sprints/sprint-01.md) | 2026-03-13 | 프로젝트 초기 설정, Supabase DB 설계, 홈 페이지 + 방 생성/입장 API | ✅ 완료 |
| [Sprint 2](./sprints/sprint-02.md) | 2026-03-14 | 대기실 UI, Zustand 스토어, Realtime 훅 | ✅ 완료 |
| [Sprint 3](./sprints/sprint-03.md) | 2026-03-14 | 게임 상태 머신, 역할 배정, 설명/투표/결과, 결과 화면 | ✅ 완료 |
| [Sprint 4](./sprints/sprint-04.md) | 2026-03-14 | Claude API 5개 엔드포인트, AI 플레이어 통합, 사후 분석 | ✅ 완료 |
| [Sprint 5](./sprints/sprint-05.md) | 2026-03-14 | RoleReveal 전환 수정, 반응형 디자인, 에러 처리 | ✅ 완료 |
| [Sprint 6](./sprints/sprint-06.md) | 예정 | 테스트, CI/CD, Vercel 배포, 최종 QA | ⏸ 예정 |

---

## 누적 기술 결정 사항

| 결정 | 내용 | Sprint |
| ---- | ---- | ------ |
| 세션 관리 | JWT 대신 localStorage + sessionToken (64자 hex) | Sprint 1 |
| Zustand persist | localStorage key를 기존 세션 키와 통일 (하위 호환) | Sprint 2 |
| Presence key | playerId로 설정 — 다중 탭 중복 방지 | Sprint 2 |
| 방장 권한 분리 | UI + API 이중 보호 (isHost 검증) | Sprint 2 |
| 중복 투표 방지 | DB UNIQUE 제약 `(room_id, voter_id)` | Sprint 1 |
| Realtime 전략 | players 변경 시 전체 재조회 (단순성 우선) | Sprint 1 |
| 게임 로직 분리 | 역할 배정/승패 판정을 순수 함수로 격리 (`lib/game-logic.ts`) | Sprint 3 |
| 동점 재투표 | votes 초기화 후 vote phase 유지, phase_started_at 갱신으로 타이머 재시작 | Sprint 3 |
| next-phase API | 전체 상태 머신을 단일 엔드포인트로 통일 처리 | Sprint 3 |
| AI 폴백 전략 | Claude API 실패 시 사전 정의 텍스트로 게임 진행 유지 | Sprint 4 |
| AI 트리거 방식 | 방장 클라이언트 단독 호출 (Serverless 환경 스케줄러 대체) | Sprint 4 |
| AI 분석 캐시 | game_analyses 중복 저장 방지 (DB 기존 기록 확인 후 반환) | Sprint 4 |
| shadcn Dialog | `@base-ui/react` 방식 — asChild 미지원, controlled state 사용 | Sprint 1 |
| Turbopack TLS | `experimental.turbopackUseSystemTlsCerts: true` (Windows 환경) | Sprint 1 |
