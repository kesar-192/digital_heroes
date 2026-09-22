import type { MatchTier } from "./types";

/** Distinct-value set intersection — standard lottery-style matching, position-independent. */
export function countMatches(winningNumbers: number[], subscriberScores: number[]): number {
  const winning = new Set(winningNumbers);
  const distinctScores = new Set(subscriberScores);
  let matches = 0;
  for (const value of distinctScores) if (winning.has(value)) matches++;
  return matches;
}

export function tierForMatchCount(matchedCount: number): MatchTier | null {
  if (matchedCount === 5) return "match_5";
  if (matchedCount === 4) return "match_4";
  if (matchedCount === 3) return "match_3";
  return null; // 0-2 matches: no prize
}
