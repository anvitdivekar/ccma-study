// Simple Levenshtein-based fuzzy match — good enough for one-word typos
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

export function fuzzyMatch(input: string, answer: string): boolean {
  const a = input.trim().toLowerCase();
  const b = answer.trim().toLowerCase();
  if (a === b) return true;
  // Allow up to 2 edits for short answers, 3 for longer ones
  const tolerance = b.length <= 6 ? 1 : b.length <= 12 ? 2 : 3;
  return levenshtein(a, b) <= tolerance;
}
