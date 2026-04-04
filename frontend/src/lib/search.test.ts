import { describe, it, expect } from 'vitest'
import { sanitizeSearchQuery, SEARCH_MAX_LENGTH } from './search'

describe('sanitizeSearchQuery', () => {
  it('returns the query unchanged when it is normal text', () => {
    expect(sanitizeSearchQuery('iphone 15 pro')).toBe('iphone 15 pro')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeSearchQuery('  nike shoes  ')).toBe('nike shoes')
  })

  it('returns empty string when query is empty', () => {
    expect(sanitizeSearchQuery('')).toBe('')
  })

  it('returns empty string when query contains only spaces', () => {
    expect(sanitizeSearchQuery('     ')).toBe('')
  })

  it('removes < and > characters (XSS prevention)', () => {
    expect(sanitizeSearchQuery('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
  })

  it('removes { } characters', () => {
    expect(sanitizeSearchQuery('query{injection}')).toBe('queryinjection')
  })

  it('removes [ ] characters', () => {
    expect(sanitizeSearchQuery('query[0]')).toBe('query0')
  })

  it(`truncates queries longer than ${SEARCH_MAX_LENGTH} characters`, () => {
    const longQuery = 'a'.repeat(200)
    const result = sanitizeSearchQuery(longQuery)
    expect(result.length).toBe(SEARCH_MAX_LENGTH)
  })

  it('truncates after removing dangerous characters', () => {
    // 100 'a' + dangerous chars — result should still be <= MAX_LENGTH
    const query = 'a'.repeat(99) + '<' + 'a'.repeat(10)
    const result = sanitizeSearchQuery(query)
    expect(result.length).toBeLessThanOrEqual(SEARCH_MAX_LENGTH)
    expect(result).not.toContain('<')
  })

  it('preserves numbers and hyphens', () => {
    expect(sanitizeSearchQuery('iphone-15 256gb')).toBe('iphone-15 256gb')
  })

  it('preserves accented characters', () => {
    expect(sanitizeSearchQuery('televisión 4K')).toBe('televisión 4K')
  })
})
