/**
 * "Algorithmic — weighted by score frequency" (PRD §06). Interpreted as:
 * a number 1-45 is more likely to be drawn the more often it shows up
 * across every eligible subscriber's current 5 scores. This ties the draw
 * back to real platform activity instead of being a second, unrelated
 * lottery — document this interpretation in the README as a resolved
 * ambiguity.
 *
 * Numbers with zero occurrences still get a small base weight so the draw
 * never excludes untouched numbers entirely.
 */
export function drawWeightedNumbers(
  allSubscriberScores: number[][],
  count = 5,
  max = 45,
  baseWeight = 1
): number[] {
  const frequency = new Array(max + 1).fill(0); // index 0 unused
  for (const scores of allSubscriberScores) {
    for (const value of scores) {
      if (value >= 1 && value <= max) frequency[value] += 1;
    }
  }

  const weights = new Map<number, number>();
  for (let n = 1; n <= max; n++) weights.set(n, frequency[n] + baseWeight);

  const picked: number[] = [];
  for (let i = 0; i < count && weights.size > 0; i++) {
    const total = [...weights.values()].reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;

    for (const [num, weight] of weights) {
      roll -= weight;
      if (roll <= 0) {
        picked.push(num);
        weights.delete(num); // sample without replacement
        break;
      }
    }
  }

  return picked.sort((a, b) => a - b);
}
