import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./start/route";

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

// fetchAiKeywords 내부에서 fetch를 사용 — 전역 모킹
global.fetch = vi.fn();

import { createServerClient } from "@/lib/supabase/server";
import type { Player } from "@/types/game";

const ROOM_ID = "room-uuid-1";
const HOST_SESSION = "host-session-token";

function makeRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/rooms/${ROOM_ID}/start`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost",
    },
  });
}

function makeParams() {
  return { params: Promise.resolve({ roomId: ROOM_ID }) };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: `player-${Math.random()}`,
    room_id: ROOM_ID,
    nickname: "플레이어",
    is_ai: false,
    is_host: false,
    role: null,
    is_connected: true,
    role_confirmed: false,
    session_token: "tok",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * start/route.ts 호출 순서:
 *  1. from("rooms") → select.eq.single → room
 *  2. from("players") → select.eq.eq.eq.single → hostPlayer
 *  3. from("players") → select.eq → players[]
 *  4. from("players").update × N (역할 배정)
 *  5. from("rooms") → update.eq → phase 전환
 */
function makeMock({
  room,
  hostPlayer,
  players = [],
  updateErr = null,
}: {
  room: object | null;
  hostPlayer: object | null;
  players?: object[];
  updateErr?: object | null;
}) {
  let roomsCallIndex = 0;
  let playersCallIndex = 0;

  const mock = {
    from: vi.fn((table: string) => {
      if (table === "rooms") {
        roomsCallIndex++;
        if (roomsCallIndex === 1) {
          // 1. room 조회
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: room,
              error: room ? null : { message: "not found" },
            }),
          };
        }
        // 5. rooms update
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: updateErr }),
        };
      }

      if (table === "players") {
        playersCallIndex++;
        if (playersCallIndex === 1) {
          // 2. hostPlayer 조회
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: hostPlayer, error: null }),
          };
        }
        if (playersCallIndex === 2) {
          // 3. players[] 조회
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: players, error: null }),
          };
        }
        // 4. player role update
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      return {};
    }),
  };

  return mock;
}

describe("POST /api/rooms/[roomId]/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 바보 모드 AI 키워드 생성 fetch mock (기본: 실패 → 폴백 사용)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
  });

  it("세션 토큰 없음 → 400 반환", async () => {
    const res = await POST(makeRequest({}), makeParams());
    expect(res.status).toBe(400);
  });

  it("잘못된 JSON → 400 반환", async () => {
    const req = new NextRequest(`http://localhost/api/rooms/${ROOM_ID}/start`, {
      method: "POST",
      body: "invalid-json",
      headers: { "Content-Type": "application/json", origin: "http://localhost" },
    });
    const res = await POST(req, makeParams());
    expect(res.status).toBe(400);
  });

  it("방 없음 → 404 반환", async () => {
    const mock = makeMock({ room: null, hostPlayer: null });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ sessionToken: HOST_SESSION }), makeParams());
    expect(res.status).toBe(404);
  });

  it("이미 게임 시작됨 (phase != waiting) → 400 반환", async () => {
    const mock = makeMock({
      room: { id: ROOM_ID, phase: "description", mode: "classic", category: "음식" },
      hostPlayer: null,
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ sessionToken: HOST_SESSION }), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("이미");
  });

  it("방장이 아님 → 403 반환", async () => {
    const mock = makeMock({
      room: { id: ROOM_ID, phase: "waiting", mode: "classic", category: "음식" },
      hostPlayer: null, // 방장 조회 실패
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ sessionToken: "non-host-token" }), makeParams());
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("방장");
  });

  it("플레이어 3명 미만 → 400 반환", async () => {
    const players = [makePlayer({ is_host: true }), makePlayer()];

    const mock = makeMock({
      room: { id: ROOM_ID, phase: "waiting", mode: "classic", category: "음식" },
      hostPlayer: { id: "host-id" },
      players, // 2명만
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ sessionToken: HOST_SESSION }), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("3명");
  });

  it("정상 시작 (classic 모드, 3명) → 200 + ok:true 반환", async () => {
    const players = [
      makePlayer({ id: "p1", is_host: true }),
      makePlayer({ id: "p2" }),
      makePlayer({ id: "p3" }),
    ];

    const mock = makeMock({
      room: { id: ROOM_ID, phase: "waiting", mode: "classic", category: "음식" },
      hostPlayer: { id: "p1" },
      players,
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ sessionToken: HOST_SESSION }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("정상 시작 (fool 모드) → AI 키워드 fetch 시도 후 폴백 포함 200 반환", async () => {
    const players = [
      makePlayer({ id: "p1", is_host: true }),
      makePlayer({ id: "p2" }),
      makePlayer({ id: "p3" }),
    ];

    const mock = makeMock({
      room: { id: ROOM_ID, phase: "waiting", mode: "fool", category: "음식" },
      hostPlayer: { id: "p1" },
      players,
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    // fetch 실패 → 폴백 키워드 사용
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const res = await POST(makeRequest({ sessionToken: HOST_SESSION }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("DB 업데이트 실패 → 500 반환", async () => {
    const players = [
      makePlayer({ id: "p1", is_host: true }),
      makePlayer({ id: "p2" }),
      makePlayer({ id: "p3" }),
    ];

    const mock = makeMock({
      room: { id: ROOM_ID, phase: "waiting", mode: "classic", category: "음식" },
      hostPlayer: { id: "p1" },
      players,
      updateErr: { message: "DB error" },
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ sessionToken: HOST_SESSION }), makeParams());
    expect(res.status).toBe(500);
  });
});
