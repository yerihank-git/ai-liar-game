import { describe, it, expect } from "vitest";
import {
  assignRoles,
  determineTurnOrder,
  countVotes,
  judgeClassic,
  judgeFool,
  pickRandomKeyword,
  getNextTurnPlayerId,
} from "./game-logic";
import type { Player, Vote } from "@/types/game";

// ── 테스트용 픽스처 ───────────────────────────────────────

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    room_id: "room-1",
    nickname: `플레이어${i + 1}`,
    is_ai: false,
    is_host: i === 0,
    role: null,
    is_connected: true,
    role_confirmed: false,
    session_token: `token-${i + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

function makeVotes(pairs: [voter: string, target: string][]): Vote[] {
  return pairs.map(([voter_id, target_id], i) => ({
    id: `vote-${i + 1}`,
    room_id: "room-1",
    voter_id,
    target_id,
    created_at: new Date().toISOString(),
  }));
}

// ── assignRoles ───────────────────────────────────────────

describe("assignRoles", () => {
  it("classic 모드: 정확히 1명이 liar, 나머지는 citizen", () => {
    const players = makePlayers(5);
    const roles = assignRoles(players, "classic");

    const liars = [...roles.values()].filter((r) => r === "liar");
    const citizens = [...roles.values()].filter((r) => r === "citizen");

    expect(liars).toHaveLength(1);
    expect(citizens).toHaveLength(4);
    expect(roles.size).toBe(5);
  });

  it("fool 모드: 정확히 1명이 fool, 나머지는 citizen", () => {
    const players = makePlayers(4);
    const roles = assignRoles(players, "fool");

    const fools = [...roles.values()].filter((r) => r === "fool");
    const citizens = [...roles.values()].filter((r) => r === "citizen");

    expect(fools).toHaveLength(1);
    expect(citizens).toHaveLength(3);
  });

  it("모든 플레이어가 roleMap에 포함됨", () => {
    const players = makePlayers(3);
    const roles = assignRoles(players, "classic");

    for (const player of players) {
      expect(roles.has(player.id)).toBe(true);
    }
  });

  it("2인 게임: 1명 liar + 1명 citizen", () => {
    const players = makePlayers(2);
    const roles = assignRoles(players, "classic");

    expect(roles.size).toBe(2);
    expect([...roles.values()].filter((r) => r === "liar")).toHaveLength(1);
    expect([...roles.values()].filter((r) => r === "citizen")).toHaveLength(1);
  });
});

// ── determineTurnOrder ────────────────────────────────────

describe("determineTurnOrder", () => {
  it("모든 플레이어 id가 포함됨", () => {
    const players = makePlayers(5);
    const order = determineTurnOrder(players);

    expect(order).toHaveLength(5);
    for (const player of players) {
      expect(order).toContain(player.id);
    }
  });

  it("중복 없음", () => {
    const players = makePlayers(6);
    const order = determineTurnOrder(players);

    expect(new Set(order).size).toBe(order.length);
  });

  it("1명이면 그대로 반환", () => {
    const players = makePlayers(1);
    const order = determineTurnOrder(players);

    expect(order).toEqual([players[0].id]);
  });
});

// ── countVotes ────────────────────────────────────────────

describe("countVotes", () => {
  it("빈 투표 → topPlayerId null, isTie false", () => {
    const result = countVotes([]);

    expect(result.topPlayerId).toBeNull();
    expect(result.isTie).toBe(false);
    expect(result.tally).toEqual({});
  });

  it("단독 최다 득표자 반환", () => {
    const votes = makeVotes([
      ["p1", "p3"],
      ["p2", "p3"],
      ["p3", "p2"],
    ]);
    const result = countVotes(votes);

    expect(result.topPlayerId).toBe("p3");
    expect(result.isTie).toBe(false);
    expect(result.tally["p3"]).toBe(2);
  });

  it("동점이면 isTie true, topPlayerId null", () => {
    const votes = makeVotes([
      ["p1", "p2"],
      ["p2", "p3"],
      ["p3", "p1"],
    ]);
    const result = countVotes(votes);

    expect(result.isTie).toBe(true);
    expect(result.topPlayerId).toBeNull();
  });

  it("1표 단독 득표", () => {
    const votes = makeVotes([["p1", "p2"]]);
    const result = countVotes(votes);

    expect(result.topPlayerId).toBe("p2");
    expect(result.isTie).toBe(false);
  });

  it("tally에 모든 타겟 집계됨", () => {
    const votes = makeVotes([
      ["p1", "p3"],
      ["p2", "p3"],
      ["p3", "p2"],
      ["p4", "p1"],
    ]);
    const result = countVotes(votes);

    expect(result.tally["p3"]).toBe(2);
    expect(result.tally["p2"]).toBe(1);
    expect(result.tally["p1"]).toBe(1);
  });
});

// ── judgeClassic ──────────────────────────────────────────

describe("judgeClassic", () => {
  const LIAR_ID = "player-liar";
  const KEYWORD = "사과";

  it("라이어 미지목 → 라이어 승, correct_guess false", () => {
    const result = judgeClassic({
      accusedPlayerId: "player-1",
      liarPlayerId: LIAR_ID,
      guessedKeyword: null,
      actualKeyword: KEYWORD,
    });

    expect(result.winner).toBe("liar");
    expect(result.correct_guess).toBe(false);
    expect(result.liar_player_id).toBe(LIAR_ID);
  });

  it("라이어 지목 + 정답 → 라이어 승, correct_guess true", () => {
    const result = judgeClassic({
      accusedPlayerId: LIAR_ID,
      liarPlayerId: LIAR_ID,
      guessedKeyword: "사과",
      actualKeyword: KEYWORD,
    });

    expect(result.winner).toBe("liar");
    expect(result.correct_guess).toBe(true);
  });

  it("라이어 지목 + 오답 → 시민 승, correct_guess false", () => {
    const result = judgeClassic({
      accusedPlayerId: LIAR_ID,
      liarPlayerId: LIAR_ID,
      guessedKeyword: "바나나",
      actualKeyword: KEYWORD,
    });

    expect(result.winner).toBe("citizens");
    expect(result.correct_guess).toBe(false);
  });

  it("대소문자/공백 무시하고 정답 판정", () => {
    const result = judgeClassic({
      accusedPlayerId: LIAR_ID,
      liarPlayerId: LIAR_ID,
      guessedKeyword: "  사과  ",
      actualKeyword: "사과",
    });

    expect(result.winner).toBe("liar");
    expect(result.correct_guess).toBe(true);
  });

  it("guessedKeyword가 null이면 오답 처리", () => {
    const result = judgeClassic({
      accusedPlayerId: LIAR_ID,
      liarPlayerId: LIAR_ID,
      guessedKeyword: null,
      actualKeyword: KEYWORD,
    });

    expect(result.winner).toBe("citizens");
    expect(result.correct_guess).toBe(false);
  });
});

// ── judgeFool ─────────────────────────────────────────────

describe("judgeFool", () => {
  const FOOL_ID = "player-fool";

  it("바보 지목 → 시민 승", () => {
    const result = judgeFool({ accusedPlayerId: FOOL_ID, foolPlayerId: FOOL_ID });

    expect(result.winner).toBe("citizens");
    expect(result.fool_player_id).toBe(FOOL_ID);
  });

  it("바보 미지목 → 바보 승", () => {
    const result = judgeFool({ accusedPlayerId: "player-1", foolPlayerId: FOOL_ID });

    expect(result.winner).toBe("fool");
    expect(result.fool_player_id).toBe(FOOL_ID);
  });

  it("accusedPlayerId가 null → 바보 승", () => {
    const result = judgeFool({ accusedPlayerId: null, foolPlayerId: FOOL_ID });

    expect(result.winner).toBe("fool");
  });
});

// ── pickRandomKeyword ─────────────────────────────────────

describe("pickRandomKeyword", () => {
  it("반환값이 목록 안에 있음", () => {
    const keywords = ["사과", "바나나", "포도"];
    const result = pickRandomKeyword(keywords);

    expect(keywords).toContain(result);
  });

  it("1개짜리 목록 → 항상 그 값 반환", () => {
    expect(pickRandomKeyword(["유일"])).toBe("유일");
  });

  it("여러 번 호출해도 모두 목록 안 값", () => {
    const keywords = ["A", "B", "C", "D", "E"];
    for (let i = 0; i < 50; i++) {
      expect(keywords).toContain(pickRandomKeyword(keywords));
    }
  });
});

// ── getNextTurnPlayerId ───────────────────────────────────

describe("getNextTurnPlayerId", () => {
  const ORDER = ["p1", "p2", "p3", "p4"];

  it("중간 플레이어 → 다음 플레이어 반환", () => {
    expect(getNextTurnPlayerId(ORDER, "p1")).toBe("p2");
    expect(getNextTurnPlayerId(ORDER, "p2")).toBe("p3");
    expect(getNextTurnPlayerId(ORDER, "p3")).toBe("p4");
  });

  it("마지막 플레이어 → null 반환", () => {
    expect(getNextTurnPlayerId(ORDER, "p4")).toBeNull();
  });

  it("목록에 없는 id → null 반환", () => {
    expect(getNextTurnPlayerId(ORDER, "p99")).toBeNull();
  });

  it("빈 순서 배열 → null 반환", () => {
    expect(getNextTurnPlayerId([], "p1")).toBeNull();
  });

  it("1명짜리 순서 → null 반환", () => {
    expect(getNextTurnPlayerId(["p1"], "p1")).toBeNull();
  });
});
