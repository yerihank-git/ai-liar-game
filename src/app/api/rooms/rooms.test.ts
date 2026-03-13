import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "./route";

// Supabase 서버 클라이언트 모킹
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

// generateRoomCode 모킹 (예측 가능한 코드 반환)
vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    generateRoomCode: vi.fn(() => "ABC123"),
  };
});

import { createServerClient } from "@/lib/supabase/server";

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    ...overrides,
  };
  return {
    from: vi.fn(() => chainable),
    _chain: chainable,
  };
}

// ── POST /api/rooms ────────────────────────────────────────

describe("POST /api/rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("닉네임 없으면 400 반환", async () => {
    const req = new NextRequest("http://localhost/api/rooms", {
      method: "POST",
      body: JSON.stringify({ sessionToken: "token-abc" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("닉네임");
  });

  it("닉네임 1자리면 400 반환", async () => {
    const req = new NextRequest("http://localhost/api/rooms", {
      method: "POST",
      body: JSON.stringify({ nickname: "a", sessionToken: "token-abc" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("세션 토큰 없으면 400 반환", async () => {
    const req = new NextRequest("http://localhost/api/rooms", {
      method: "POST",
      body: JSON.stringify({ nickname: "테스터" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("세션 토큰");
  });

  it("정상 요청 → 201 + roomId/playerId 반환", async () => {
    const mock = makeSupabaseMock();
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    // 방 코드 중복 확인: null → 코드 사용 가능
    mock._chain.single
      .mockResolvedValueOnce({ data: null, error: null }) // 코드 중복 없음
      .mockResolvedValueOnce({ data: { id: "room-uuid-1" }, error: null }) // room insert
      .mockResolvedValueOnce({ data: { id: "player-uuid-1" }, error: null }); // player insert

    const req = new NextRequest("http://localhost/api/rooms", {
      method: "POST",
      body: JSON.stringify({ nickname: "테스터", sessionToken: "session-token-abc" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty("roomId");
    expect(json).toHaveProperty("playerId");
  });

  it("잘못된 JSON body → 400 반환", async () => {
    const req = new NextRequest("http://localhost/api/rooms", {
      method: "POST",
      body: "invalid-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ── GET /api/rooms?code=XXXXXX ─────────────────────────────

describe("GET /api/rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("code 파라미터 없으면 400 반환", async () => {
    const req = new NextRequest("http://localhost/api/rooms");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("방 코드");
  });

  it("6자리 미만 코드 → 400 반환", async () => {
    const req = new NextRequest("http://localhost/api/rooms?code=ABC");
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it("존재하지 않는 방 코드 → 404 반환", async () => {
    const mock = makeSupabaseMock();
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);
    mock._chain.single.mockResolvedValueOnce({ data: null, error: null });

    const req = new NextRequest("http://localhost/api/rooms?code=NOTEXS");
    const res = await GET(req);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("존재하지 않는");
  });

  it("정상 코드 → 200 + roomId 반환", async () => {
    const mock = makeSupabaseMock();
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);
    mock._chain.single.mockResolvedValueOnce({ data: { id: "room-uuid-1", phase: "waiting" }, error: null });

    const req = new NextRequest("http://localhost/api/rooms?code=ABC123");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("roomId", "room-uuid-1");
  });
});
