const VISIBLE_COUNT = 5
const HALF = Math.floor(VISIBLE_COUNT / 2)

/**
 * Returns the list of page numbers to display in the pagination UI,
 * centred around the current page and capped at VISIBLE_COUNT pages.
 */
export function getVisiblePages(page: number, pageCount: number): number[] {
  if (pageCount <= VISIBLE_COUNT) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }

  let from = Math.max(1, page - HALF)
  let to = Math.min(pageCount, page + HALF)

  // Expand the window if it's too narrow near the edges
  if (to - from < VISIBLE_COUNT - 1) {
    if (from === 1) to = Math.min(pageCount, from + VISIBLE_COUNT - 1)
    else from = Math.max(1, to - VISIBLE_COUNT + 1)
  }

  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}
