-- ============================================================
-- LiarGame AI — 초기 스키마
-- ============================================================

-- ── 열거 타입 ─────────────────────────────────────────────

CREATE TYPE game_mode AS ENUM ('classic', 'fool');

CREATE TYPE game_phase AS ENUM (
  'waiting',
  'role_reveal',
  'description',
  'discussion',
  'vote',
  'final_defense',
  'result'
);

CREATE TYPE player_role AS ENUM ('citizen', 'liar', 'fool');

-- ── rooms 테이블 ──────────────────────────────────────────

CREATE TABLE rooms (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code               VARCHAR(6)  NOT NULL UNIQUE,
  host_player_id          UUID,                          -- FK는 players 생성 후 추가
  mode                    game_mode   NOT NULL DEFAULT 'classic',
  phase                   game_phase  NOT NULL DEFAULT 'waiting',
  category                TEXT,
  keyword                 TEXT,
  fool_keyword            TEXT,
  current_turn_player_id  UUID,
  turn_order              JSONB       NOT NULL DEFAULT '[]',  -- player id 배열
  -- 타이머 설정 (초 단위)
  description_timer_sec   INTEGER     NOT NULL DEFAULT 60,
  discussion_timer_sec    INTEGER     NOT NULL DEFAULT 120,
  vote_timer_sec          INTEGER     NOT NULL DEFAULT 30,
  final_defense_timer_sec INTEGER     NOT NULL DEFAULT 30,
  phase_started_at        TIMESTAMPTZ,
  max_players             INTEGER     NOT NULL DEFAULT 8,
  result                  JSONB,                         -- { winner: 'citizens'|'liar'|'fool', ... }
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── players 테이블 ────────────────────────────────────────

CREATE TABLE players (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname       TEXT        NOT NULL,
  is_ai          BOOLEAN     NOT NULL DEFAULT FALSE,
  is_host        BOOLEAN     NOT NULL DEFAULT FALSE,
  role           player_role,                            -- 게임 시작 전 NULL
  is_connected   BOOLEAN     NOT NULL DEFAULT TRUE,
  role_confirmed BOOLEAN     NOT NULL DEFAULT FALSE,
  session_token  TEXT        NOT NULL,                   -- 64자 랜덤 hex
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- rooms.host_player_id FK 추가
ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_host_player
  FOREIGN KEY (host_player_id) REFERENCES players(id) ON DELETE SET NULL;

-- ── descriptions 테이블 ───────────────────────────────────

CREATE TABLE descriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id   UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL DEFAULT '',
  turn_number INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── messages 테이블 (토론 채팅) ───────────────────────────

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id   UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── votes 테이블 ──────────────────────────────────────────

CREATE TABLE votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  voter_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  target_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, voter_id)   -- 방당 1인 1표
);

-- ── game_analyses 테이블 ──────────────────────────────────

CREATE TABLE game_analyses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id          UUID  NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  analysis_content JSONB NOT NULL,   -- AI 분석 결과 전체
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at 자동 갱신 트리거 ───────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 인덱스 ────────────────────────────────────────────────

CREATE INDEX idx_players_room_id      ON players(room_id);
CREATE INDEX idx_descriptions_room_id ON descriptions(room_id);
CREATE INDEX idx_messages_room_id     ON messages(room_id);
CREATE INDEX idx_votes_room_id        ON votes(room_id);
CREATE INDEX idx_game_analyses_room_id ON game_analyses(room_id);

-- ── Row Level Security (RLS) ──────────────────────────────
-- anon 키: 읽기/쓰기 허용 (서버에서 service_role 키로 override)
-- 실제 보안은 서버사이드 API Route에서 session_token 검증으로 처리

ALTER TABLE rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE players        ENABLE ROW LEVEL SECURITY;
ALTER TABLE descriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_analyses  ENABLE ROW LEVEL SECURITY;

-- anon/authenticated 역할 전체 허용 정책
CREATE POLICY "allow_all_rooms"         ON rooms         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_players"       ON players       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_descriptions"  ON descriptions  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_messages"      ON messages      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_votes"         ON votes         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_game_analyses" ON game_analyses FOR ALL USING (true) WITH CHECK (true);

-- ── Realtime Publication ──────────────────────────────────
-- Supabase 대시보드 Database > Replication 에서 활성화하거나
-- 아래 SQL을 직접 실행하세요.

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE descriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
