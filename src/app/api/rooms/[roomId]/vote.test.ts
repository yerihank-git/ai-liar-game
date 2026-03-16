import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./vote/route";

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@/lib/supabase/server";

const ROOM_ID = "room-uuid-1";
const VOTER_ID = "00000000-0000-0000-0000-000000000001";
const TARGET_ID = "00000000-0000-0000-0000-000000000002";

function makeRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/rooms/${ROOM_ID}/vote`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeParams() {
  return { params: Promise.resolve({ roomId: ROOM_ID }) };
}

/**
 * vote/route.ts 호출 순서:
 *  1. from("rooms") → select.eq.single → room
 *  2. from("players") → select.eq.eq.single → voter
 *  3. from("votes") → upsert
 *  4. from("players") → select.eq → allPlayers
 *  5. from("votes") → select.eq → allVotes
 *  (전원 투표 완료 시)
 *  6. from("players") → select.eq.single → accusedPlayer.role
 *  7. from("rooms") → update.eq → phase 전환
 */
function makeMock({
  room,
  voter,
  voteErr = null,
  allPlayers = [],
  allVotes = [],
  accusedRole = null,
}: {
  room: object | null;
  voter: object | null;
  voteErr?: object | null;
  allPlayers?: object[];
  allVotes?: object[];
  accusedRole?: string | null;
}) {
  let roomsCallIndex = 0;
  let playersCallIndex = 0;
  let votesCallIndex = 0;

  const mock = {
    from: vi.fn((table: string) => {
      if (table === "rooms") {
        roomsCallIndex++;
        if (roomsCallIndex === 1) {
          // 1. room 조회
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: room, error: null }),
          };
        }
        // N. rooms update (phase 전환)
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      if (table === "players") {
        playersCallIndex++;
        if (playersCallIndex === 1) {
          // 2. voter 조회
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: voter, error: null }),
          };
        }
        if (playersCallIndex === 2) {
          // 4. allPlayers 조회
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: allPlayers, error: null }),
          };
        }
        // accused player role 조회
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: accusedRole ? { role: accusedRole } : null,
            error: null,
          }),
        };
      }

      if (table === "votes") {
        votesCallIndex++;
        if (votesCallIndex === 1) {
          // 3. upsert
          return {
            upsert: vi.fn().mockResolvedValue({ error: voteErr }),
          };
        }
        if (votesCallIndex === 2) {
          // 5. allVotes 조회
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: allVotes, error: null }),
          };
        }
        // delete (동점 재투표)
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      return {};
    }),
  };

  return mock;
}

describe("POST /api/rooms/[roomId]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("잘못된 요청 (targetId 없음) → 400 반환", async () => {
    const res = await POST(makeRequest({ sessionToken: "tok" }), makeParams());
    expect(res.status).toBe(400);
  });

  it("targetId가 UUID 아님 → 400 반환", async () => {
    const res = await POST(
      makeRequest({ sessionToken: "tok", targetId: "not-a-uuid" }),
      makeParams()
    );
    expect(res.status).toBe(400);
  });

  it("방이 vote 단계가 아님 → 400 반환", async () => {
    const mock = makeMock({ room: { id: ROOM_ID, phase: "discussion", mode: "classic" }, voter: null });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(
      makeRequest({ sessionToken: "tok", targetId: TARGET_ID }),
      makeParams()
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("투표 단계");
  });

  it("방이 존재하지 않음 → 400 반환", async () => {
    const mock = makeMock({ room: null, voter: null });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(
      makeRequest({ sessionToken: "tok", targetId: TARGET_ID }),
      makeParams()
    );
    expect(res.status).toBe(400);
  });

  it("투표자를 찾을 수 없음 → 403 반환", async () => {
    const mock = makeMock({ room: { id: ROOM_ID, phase: "vote", mode: "classic" }, voter: null });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(
      makeRequest({ sessionToken: "invalid-tok", targetId: TARGET_ID }),
      makeParams()
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("플레이어");
  });

  it("자기 자신에게 투표 → 400 반환", async () => {
    const mock = makeMock({
      room: { id: ROOM_ID, phase: "vote", mode: "classic" },
      voter: { id: VOTER_ID },
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    // targetId를 voter와 동일하게 설정
    const res = await POST(
      makeRequest({ sessionToken: "tok", targetId: VOTER_ID }),
      makeParams()
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("자신");
  });

  it("투표 저장 실패 → 500 반환", async () => {
    const mock = makeMock({
      room: { id: ROOM_ID, phase: "vote", mode: "classic" },
      voter: { id: VOTER_ID },
      voteErr: { message: "DB error" },
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(
      makeRequest({ sessionToken: "tok", targetId: TARGET_ID }),
      makeParams()
    );
    expect(res.status).toBe(500);
  });

  it("정상 투표 (전원 미완료) → 200 + ok:true 반환", async () => {
    const allPlayers = [
      { id: VOTER_ID },
      { id: TARGET_ID },
      { id: "player-3" },
    ];
    // 아직 1명만 투표 → 전원 미완료
    const allVotes = [{ voter_id: VOTER_ID, target_id: TARGET_ID }];

    const mock = makeMock({
      room: { id: ROOM_ID, phase: "vote", mode: "classic" },
      voter: { id: VOTER_ID },
      allPlayers,
      allVotes,
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(
      makeRequest({ sessionToken: "tok", targetId: TARGET_ID }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.tie).toBeUndefined();
  });

  it("전원 투표 완료 + 동점 → 200 + tie:true (재투표)", async () => {
    // 2명 투표, 각자 상대방을 지목 → 동점
    const allPlayers = [{ id: VOTER_ID }, { id: TARGET_ID }];
    const allVotes = [
      { voter_id: VOTER_ID, target_id: TARGET_ID },
      { voter_id: TARGET_ID, target_id: VOTER_ID },
    ];

    const mock = makeMock({
      room: { id: ROOM_ID, phase: "vote", mode: "classic" },
      voter: { id: VOTER_ID },
      allPlayers,
      allVotes,
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(
      makeRequest({ sessionToken: "tok", targetId: TARGET_ID }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tie).toBe(true);
  });

  it("전원 투표 + 라이어 지목 (classic) → final_defense 단계로 전환", async () => {
    const allPlayers = [{ id: VOTER_ID }, { id: TARGET_ID }];
    const allVotes = [
      { voter_id: VOTER_ID, target_id: TARGET_ID },
      { voter_id: "other", target_id: TARGET_ID }, // TARGET_ID가 최다 득표
    ];

    const mock = makeMock({
      room: { id: ROOM_ID, phase: "vote", mode: "classic" },
      voter: { id: VOTER_ID },
      allPlayers,
      allVotes,
      accusedRole: "liar",
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(
      makeRequest({ sessionToken: "tok", targetId: TARGET_ID }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("전원 투표 + 시민 지목 (classic) → result 단계로 전환", async () => {
    const allPlayers = [{ id: VOTER_ID }, { id: TARGET_ID }];
    const allVotes = [
      { voter_id: VOTER_ID, target_id: TARGET_ID },
      { voter_id: "other", target_id: TARGET_ID },
    ];

    const mock = makeMock({
      room: { id: ROOM_ID, phase: "vote", mode: "classic" },
      voter: { id: VOTER_ID },
      allPlayers,
      allVotes,
      accusedRole: "citizen", // 라이어가 아님
    });
    vi.mocked(createServerClient).mockReturnValue(mock as ReturnType<typeof createServerClient>);

    const res = await POST(
      makeRequest({ sessionToken: "tok", targetId: TARGET_ID }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
