# 개발 진행 기록 — LiarGame AI

> Sprint별 개발 과정, 기술적 결정, 트러블슈팅을 기록합니다.
> 각 Sprint는 개별 파일로 관리됩니다.

---

## Sprint 목록

| Sprint | 기간 | 주요 내용 | 상태 |
| ------ | ---- | --------- | ---- |
| [Sprint 1](./sprints/sprint-01.md) | 2026-03-13 | 프로젝트 초기 설정, Supabase DB 설계, 홈 페이지 + 방 생성/입장 API | ✅ 완료 |
| [Sprint 2](./sprints/sprint-02.md) | 2026-03-14 ~ | 대기실 UI, Zustand 스토어, Realtime 훅 | 🔄 예정 |
| [Sprint 3](./sprints/sprint-03.md) | 예정 | 게임 상태 머신, 역할 배정, 설명/투표/결과 | ⏸ 예정 |
| [Sprint 4](./sprints/sprint-04.md) | 예정 | Claude API 5개 엔드포인트, AI 플레이어 통합 | ⏸ 예정 |
| [Sprint 5](./sprints/sprint-05.md) | 예정 | 토론 채팅 고도화, 타이머, 반응형, 에러 처리 | ⏸ 예정 |
| [Sprint 6](./sprints/sprint-06.md) | 예정 | 테스트, CI/CD, Vercel 배포, 최종 QA | ⏸ 예정 |

---

## 누적 기술 결정 사항

| 결정 | 내용 | Sprint |
| ---- | ---- | ------ |
| 세션 관리 | JWT 대신 localStorage + sessionToken (64자 hex) | Sprint 1 |
| 중복 투표 방지 | DB UNIQUE 제약 `(room_id, voter_id)` | Sprint 1 |
| Realtime 전략 | players 변경 시 전체 재조회 (단순성 우선) | Sprint 1 |
| shadcn Dialog | `@base-ui/react` 방식 — asChild 미지원, controlled state 사용 | Sprint 1 |
| Turbopack TLS | `experimental.turbopackUseSystemTlsCerts: true` (Windows 환경) | Sprint 1 |
