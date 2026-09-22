export type DrawType = "random" | "algorithmic";
export type MatchTier = "match_5" | "match_4" | "match_3";

export type EligibleSubscriber = {
  userId: string;
  /** Distinct Stableford values from the subscriber's 5 latest scores — their "ticket". */
  scores: number[];
};

export type TierResult = {
  poolMinor: number;
  winnerCount: number;
  prizePerWinnerMinor: number;
};

export type DrawEntryResult = {
  userId: string;
  scoresSnapshot: number[];
  matchedCount: number;
  tier: MatchTier | null;
  prizeMinor: number;
};

export type DrawSimulationResult = {
  drawType: DrawType;
  winningNumbers: number[];
  activeSubscriberCount: number;
  poolTotalMinor: number;
  jackpotCarriedInMinor: number;
  jackpotRolledOverMinor: number;
  tiers: Record<MatchTier, TierResult>;
  entries: DrawEntryResult[];
};
