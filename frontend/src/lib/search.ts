const MAX_LENGTH = 100
const DANGEROUS_CHARS = /[<>{}[\]\\^`|]/g

/**
 * Sanitizes a search query string:
 * - Trims leading/trailing whitespace
 * - Removes potentially dangerous characters
 * - Truncates to MAX_LENGTH characters
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(DANGEROUS_CHARS, '')
    .slice(0, MAX_LENGTH)
}

export const SEARCH_MAX_LENGTH = MAX_LENGTH
