import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RoleReveal } from "./RoleReveal";
import type { Room, Player } from "@/types/game";

// fetch 전역 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "room-1",
    room_code: "ABC123",
    host_player_id: "player-1",
    mode: "classic",
    phase: "role_reveal",
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

function makePlayers(overrides: Partial<Player>[] = []): Player[] {
  return overrides.map((o, i) => ({
    id: `player-${i + 1}`,
    room_id: "room-1",
    nickname: `플레이어${i + 1}`,
    is_ai: false,
    is_host: i === 0,
    role: "citizen",
    is_connected: true,
    role_confirmed: false,
    session_token: `tok-${i + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...o,
  }));
}

describe("RoleReveal 컴포넌트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("초기 렌더링 — 카드 앞면(탭하여 확인)이 보임", () => {
    const players = makePlayers([{ role: "citizen" }]);
    render(
      <RoleReveal
        room={makeRoom()}
        players={players}
        currentPlayerId="player-1"
        sessionToken="tok-1"
      />
    );

    expect(screen.getByText("탭하여 확인")).toBeDefined();
    expect(screen.getByText("역할 확인")).toBeDefined();
  });

  it("카드 클릭 → 역할 공개 + 확인 완료 버튼 표시", async () => {
    const players = makePlayers([{ role: "citizen" }]);
    render(
      <RoleReveal
        room={makeRoom()}
        players={players}
        currentPlayerId="player-1"
        sessionToken="tok-1"
      />
    );

    const card = screen.getByText("탭하여 확인").closest("div[style]")?.parentElement?.parentElement;
    expect(card).toBeDefined();

    // perspective 컨테이너 클릭
    const container = document.querySelector("[style*='perspective']") as HTMLElement;
    fireEvent.click(container);

    await waitFor(() => {
      expect(screen.getByText("확인 완료")).toBeDefined();
    });
  });

  it("라이어 역할 — 키워드 없음 텍스트 표시", async () => {
    const players = makePlayers([{ id: "player-1", role: "liar" }]);
    render(
      <RoleReveal
        room={makeRoom()}
        players={players}
        currentPlayerId="player-1"
        sessionToken="tok-1"
      />
    );

    const container = document.querySelector("[style*='perspective']") as HTMLElement;
    fireEvent.click(container);

    await waitFor(() => {
      expect(screen.getByText("키워드 없음")).toBeDefined();
    });
  });

  it("시민 역할 — 키워드 표시", async () => {
    const players = makePlayers([{ id: "player-1", role: "citizen" }]);
    render(
      <RoleReveal
        room={makeRoom({ keyword: "사과" })}
        players={players}
        currentPlayerId="player-1"
        sessionToken="tok-1"
      />
    );

    const container = document.querySelector("[style*='perspective']") as HTMLElement;
    fireEvent.click(container);

    await waitFor(() => {
      expect(screen.getByText("사과")).toBeDefined();
    });
  });

  it("확인 완료 버튼 클릭 → fetch 호출 + 버튼 비활성화", async () => {
    const players = makePlayers([{ id: "player-1", role: "citizen" }]);
    render(
      <RoleReveal
        room={makeRoom()}
        players={players}
        currentPlayerId="player-1"
        sessionToken="tok-1"
      />
    );

    // 카드 클릭 → 뒷면 공개
    const container = document.querySelector("[style*='perspective']") as HTMLElement;
    fireEvent.click(container);

    const button = await screen.findByText("확인 완료");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/rooms/room-1/confirm-role",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("확인 현황 텍스트 표시 (n/m명) — 카드 flip 후", async () => {
    const players = makePlayers([
      { id: "player-1", role_confirmed: false },
      { id: "player-2", role_confirmed: true },
      { id: "player-3", role_confirmed: true },
    ]);
    render(
      <RoleReveal
        room={makeRoom()}
        players={players}
        currentPlayerId="player-1"
        sessionToken="tok-1"
      />
    );

    // 카드 클릭 → flipped = true → 확인 현황 텍스트 표시
    const container = document.querySelector("[style*='perspective']") as HTMLElement;
    fireEvent.click(container);

    await waitFor(() => {
      expect(screen.getByText(/2\/3명/)).toBeDefined();
    });
  });
});
