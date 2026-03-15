import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultBanner } from "./ResultBanner";
import type { Room, Player } from "@/types/game";

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "room-1",
    room_code: "ABC123",
    host_player_id: "player-1",
    mode: "classic",
    phase: "result",
    category: "음식",
    keyword: "사과",
    fool_keyword: null,
    current_turn_player_id: null,
    turn_order: [],
    description_timer_sec: 60,
    discussion_timer_sec: 120,
    vote_timer_sec: 60,
    final_defense_timer_sec: 30,
    phase_started_at: null,
    max_players: 8,
    result: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    room_id: "room-1",
    nickname: "플레이어1",
    is_ai: false,
    is_host: true,
    role: "citizen",
    is_connected: true,
    role_confirmed: true,
    session_token: "tok-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("ResultBanner 컴포넌트", () => {
  it("result가 null이면 아무것도 렌더링하지 않음", () => {
    const { container } = render(
      <ResultBanner room={makeRoom()} players={[makePlayer()]} currentPlayerId="player-1" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("시민 승리 — 시민 플레이어는 '🎉 승리!' 표시", () => {
    const room = makeRoom({
      result: { winner: "citizens", accused_player_id: "player-2", correct_guess: false, guessed_keyword: null },
    });
    render(
      <ResultBanner
        room={room}
        players={[makePlayer({ role: "citizen" })]}
        currentPlayerId="player-1"
      />
    );

    expect(screen.getByText("시민 승리")).toBeDefined();
    expect(screen.getByText("🎉 승리!")).toBeDefined();
  });

  it("시민 승리 — 라이어 플레이어는 '😔 패배' 표시", () => {
    const room = makeRoom({
      result: { winner: "citizens", accused_player_id: "player-1", correct_guess: false, guessed_keyword: null },
    });
    render(
      <ResultBanner
        room={room}
        players={[makePlayer({ role: "liar" })]}
        currentPlayerId="player-1"
      />
    );

    expect(screen.getByText("시민 승리")).toBeDefined();
    expect(screen.getByText("😔 패배")).toBeDefined();
  });

  it("라이어 승리 (역전) — 맞힌 키워드 텍스트 표시", () => {
    const room = makeRoom({
      result: { winner: "liar", accused_player_id: "player-1", correct_guess: true, guessed_keyword: "사과" },
    });
    render(
      <ResultBanner
        room={room}
        players={[makePlayer({ role: "liar" })]}
        currentPlayerId="player-1"
      />
    );

    expect(screen.getByText("라이어 승리")).toBeDefined();
    expect(screen.getByText(/키워드 '사과'를 맞혀 역전 승리/)).toBeDefined();
    expect(screen.getByText("🎉 승리!")).toBeDefined();
  });

  it("바보 승리 — 바보 플레이어는 '🎉 승리!' 표시", () => {
    const room = makeRoom({
      mode: "fool",
      result: { winner: "fool", accused_player_id: null, correct_guess: false, guessed_keyword: null },
    });
    render(
      <ResultBanner
        room={room}
        players={[makePlayer({ role: "fool" })]}
        currentPlayerId="player-1"
      />
    );

    expect(screen.getByText("바보 승리")).toBeDefined();
    expect(screen.getByText("🎉 승리!")).toBeDefined();
  });

  it("AI 플레이어는 승패 배지를 표시하지 않음", () => {
    const room = makeRoom({
      result: { winner: "citizens", accused_player_id: "player-2", correct_guess: false, guessed_keyword: null },
    });
    render(
      <ResultBanner
        room={room}
        players={[makePlayer({ is_ai: true, role: "citizen" })]}
        currentPlayerId="player-1"
      />
    );

    expect(screen.queryByText("🎉 승리!")).toBeNull();
    expect(screen.queryByText("😔 패배")).toBeNull();
  });
});
