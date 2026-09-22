import { describe, it, expect } from "vitest";
import { drawRandomNumbers } from "@/lib/draw/random";
import { countMatches, tierForMatchCount } from "@/lib/draw/match";
import { computePoolTotalMinor, computeTierPools, settleTier } from "@/lib/draw/prize-pool";
import { simulateDraw } from "@/lib/draw/simulate";

describe("drawRandomNumbers", () => {
  it("returns 5 distinct numbers between 1 and 45", () => {
    const numbers = drawRandomNumbers();
    expect(numbers).toHaveLength(5);
    expect(new Set(numbers).size).toBe(5);
    numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(45);
    });
  });
});

describe("countMatches / tierForMatchCount", () => {
  it("counts distinct-value intersection", () => {
    expect(countMatches([1, 2, 3, 4, 5], [1, 1, 2, 9, 10])).toBe(2);
  });

  it("maps match count to the correct tier", () => {
    expect(tierForMatchCount(5)).toBe("match_5");
    expect(tierForMatchCount(4)).toBe("match_4");
    expect(tierForMatchCount(3)).toBe("match_3");
    expect(tierForMatchCount(2)).toBeNull();
    expect(tierForMatchCount(0)).toBeNull();
  });
});

describe("prize pool math", () => {
  it("normalises yearly subscriptions to a monthly equivalent", () => {
    const pool = computePoolTotalMinor(
      [
        { amountMinor: 1200, interval: "year" }, // -> 100/mo
        { amountMinor: 500, interval: "month" },
      ],
      50 // 50%
    );
    expect(pool).toBe(Math.round((100 + 500) * 0.5));
  });

  it("adds the carried-in jackpot to the match_5 tier only", () => {
    const pools = computeTierPools(1000, 250, {
      prizePoolPercent: 50,
      shareMatch5: 40,
      shareMatch4: 35,
      shareMatch3: 25,
    });
    expect(pools.match_5).toBe(400 + 250);
    expect(pools.match_4).toBe(350);
    expect(pools.match_3).toBe(250);
  });

  it("splits a tier equally and floors the remainder", () => {
    expect(settleTier(100, 3)).toEqual({ poolMinor: 100, winnerCount: 3, prizePerWinnerMinor: 33 });
    expect(settleTier(100, 0)).toEqual({ poolMinor: 100, winnerCount: 0, prizePerWinnerMinor: 0 });
  });
});

describe("simulateDraw", () => {
  const settings = { prizePoolPercent: 50, shareMatch5: 40, shareMatch4: 35, shareMatch3: 25 };

  it("rolls the jackpot over when nobody hits 5 matches", () => {
    const result = simulateDraw({
      drawType: "random",
      eligibleSubscribers: [{ userId: "u1", scores: [1, 2, 3, 4, 5] }],
      activeSubscriptions: [{ amountMinor: 1000, interval: "month" }],
      jackpotCarriedInMinor: 0,
      settings,
      numberGenerator: () => [10, 20, 30, 40, 45], // guarantees 0 matches
    });

    expect(result.tiers.match_5.winnerCount).toBe(0);
    expect(result.jackpotRolledOverMinor).toBe(result.tiers.match_5.poolMinor);
    expect(result.entries[0].tier).toBeNull();
  });

  it("assigns the correct tier and prize when a subscriber matches all 5", () => {
    const winningNumbers = [1, 2, 3, 4, 5];
    const result = simulateDraw({
      drawType: "random",
      eligibleSubscribers: [{ userId: "u1", scores: [1, 2, 3, 4, 5] }],
      activeSubscriptions: [{ amountMinor: 1000, interval: "month" }],
      jackpotCarriedInMinor: 0,
      settings,
      numberGenerator: () => winningNumbers,
    });

    expect(result.entries[0].tier).toBe("match_5");
    expect(result.entries[0].prizeMinor).toBe(result.tiers.match_5.prizePerWinnerMinor);
    expect(result.jackpotRolledOverMinor).toBe(0);
  });
});
