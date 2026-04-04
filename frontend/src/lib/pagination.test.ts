import { describe, it, expect } from 'vitest'
import { getVisiblePages } from './pagination'

describe('getVisiblePages', () => {
  it('returns all pages when pageCount is less than 5', () => {
    expect(getVisiblePages(1, 3)).toEqual([1, 2, 3])
  })

  it('returns all pages when pageCount equals 5', () => {
    expect(getVisiblePages(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('returns single page when pageCount is 1', () => {
    expect(getVisiblePages(1, 1)).toEqual([1])
  })

  it('starts from page 1 when on the first page', () => {
    const pages = getVisiblePages(1, 20)
    expect(pages[0]).toBe(1)
    expect(pages).toHaveLength(5)
  })

  it('ends at last page when on the last page', () => {
    const pages = getVisiblePages(20, 20)
    expect(pages[pages.length - 1]).toBe(20)
    expect(pages).toHaveLength(5)
  })

  it('centres the window around the current page in the middle', () => {
    const pages = getVisiblePages(10, 20)
    expect(pages).toContain(10)
    expect(pages).toHaveLength(5)
    expect(pages[0]).toBe(8)
    expect(pages[4]).toBe(12)
  })

  it('always returns at most 5 pages', () => {
    for (let page = 1; page <= 30; page++) {
      expect(getVisiblePages(page, 30).length).toBeLessThanOrEqual(5)
    }
  })

  it('always includes the current page', () => {
    for (let page = 1; page <= 20; page++) {
      expect(getVisiblePages(page, 20)).toContain(page)
    }
  })

  it('returns pages in ascending order', () => {
    const pages = getVisiblePages(7, 15)
    const sorted = [...pages].sort((a, b) => a - b)
    expect(pages).toEqual(sorted)
  })
})
