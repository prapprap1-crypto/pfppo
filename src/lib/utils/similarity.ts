/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity percentage between two strings (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  // Normalize strings for comparison
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity * 10) / 10; // Round to 1 decimal
}

/**
 * Find similar matches from a list of items
 */
export interface SimilarMatch<T> {
  item: T;
  similarity: number;
  matchField: string;
}

export function findSimilarMatches<T>(
  searchTerm: string,
  items: T[],
  getField: (item: T) => string,
  minSimilarity: number = 50
): SimilarMatch<T>[] {
  if (!searchTerm || !items.length) return [];

  const matches: SimilarMatch<T>[] = [];

  for (const item of items) {
    const fieldValue = getField(item);
    const similarity = calculateSimilarity(searchTerm, fieldValue);

    if (similarity >= minSimilarity) {
      matches.push({
        item,
        similarity,
        matchField: fieldValue,
      });
    }
  }

  // Sort by similarity descending
  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Get similarity color based on percentage
 */
export function getSimilarityColor(similarity: number): string {
  if (similarity >= 90) return 'text-green-600';
  if (similarity >= 70) return 'text-yellow-600';
  if (similarity >= 50) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get similarity badge variant based on percentage
 */
export function getSimilarityVariant(similarity: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (similarity >= 90) return 'default';
  if (similarity >= 70) return 'secondary';
  return 'outline';
}
