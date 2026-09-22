/**
 * Cryptographically-irrelevant but statistically uniform: a partial
 * Fisher-Yates shuffle over 1..45, taking the first 5. Pure function — no
 * I/O — so it's directly unit-testable and reusable by both simulate and
 * publish.
 */
export function drawRandomNumbers(count = 5, max = 45): number[] {
  const pool = Array.from({ length: max }, (_, i) => i + 1);

  for (let i = pool.length - 1; i > pool.length - 1 - count; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const value = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = value;
  }

  return pool.slice(pool.length - count).sort((a, b) => a - b);
}
