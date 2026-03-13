import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./join/route";

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@/lib/supabase/server";

const ROOM_ID = "room-uuid-1";

function makeRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/rooms/${ROOM_ID}/join`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeParams() {
  return { params: Promise.resolve({ roomId: ROOM_ID }) };
}

/**
 * 테이블별 체인을 분리한 Supabase 목 생성
 * join/route.ts 호출 순서:
 *  1. from("rooms") → select.eq.single → room 정보
 *  2. from("players") select(id, {count}) → eq → count (awaitable)
 *  3. from("players") select(id) → eq.eq.single → existing player 또는 새 player insert
 */
function makeMock({
  room,
  playerCount = 0,
  existingPlayer = null,
  newPlayer = null,
}: {
  room: object | null;
  playerCount?: number;
  existingPlayer?: { id: string } | null;
  newPlayer?: { id: string } | null;
}) {
  // rooms 체인
  const roomsChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: room, error: null }),
  };

  // players count 체인 (select → eq → resolves with { count })
  const countEqFn = vi.fn().mockResolvedValue({ count: playerCount, error: null });
  const countSelectFn = vi.fn().mockReturnValue({ eq: countEqFn });

  // players 검색/삽입 체인
  const playersChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
      .mockResolvedValueOnce({ data: existingPlayer, error: null })   // existing player 조회
      .mockResolvedValueOnce({ data: newPlayer, error: null }),        // new player insert
  };

  let playersCallIndex = 0;

  const mock = {
    from: vi.fn((table: string) => {
      if (table === "rooms") return roomsChain;
      // players: 첫 번째 호출 = count, 이후 = 일반 체인
      playersCallIndex++;
      if (playersCallIndex === 1) {
        return { select: countSelectFn };
      }
      return playersChain;
    }),
  };

  return mock;
}

describe("POST /api/rooms/[roomId]/join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("닉네임 없으면 400 반환", async () => {
    const res = await POST(makeRequest({ sessionToken: "tok" }), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("닉네임");
  });

  it("세션 토큰 없으면 400 반환", async () => {
    const res = await POST(makeRequest({ nickname: "테스터" }), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("세션 토큰");
  });

  it("존재하지 않는 방 → 404 반환", async () => {
    const mock = makeMock({ room: null });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ nickname: "테스터", sessionToken: "tok" }), makeParams());
    expect(res.status).toBe(404);
  });

  it("게임 진행 중인 방 → 409 반환", async () => {
    const mock = makeMock({ room: { id: ROOM_ID, phase: "description", max_players: 8 } });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ nickname: "테스터", sessionToken: "tok" }), makeParams());
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("게임이 진행");
  });

  it("방 가득 찼을 때 → 409 반환", async () => {
    const mock = makeMock({
      room: { id: ROOM_ID, phase: "waiting", max_players: 8 },
      playerCount: 8,
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ nickname: "테스터", sessionToken: "tok" }), makeParams());
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("가득");
  });

  it("기존 플레이어 재접속 → 200 + playerId 반환", async () => {
    const mock = makeMock({
      room: { id: ROOM_ID, phase: "waiting", max_players: 8 },
      playerCount: 2,
      existingPlayer: { id: "player-uuid-1" },
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ nickname: "테스터", sessionToken: "existing-tok" }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("playerId", "player-uuid-1");
  });

  it("신규 플레이어 입장 → 201 + playerId 반환", async () => {
    const mock = makeMock({
      room: { id: ROOM_ID, phase: "waiting", max_players: 8 },
      playerCount: 2,
      existingPlayer: null,
      newPlayer: { id: "new-player-uuid" },
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(makeRequest({ nickname: "새플레이어", sessionToken: "new-tok" }), makeParams());
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty("playerId", "new-player-uuid");
  });
});
