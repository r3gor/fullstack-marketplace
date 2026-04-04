import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Pagination } from './Pagination'
import type { StrapiPagination } from '@/lib/strapi'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

function makePagination(overrides: Partial<StrapiPagination> = {}): StrapiPagination {
  return {
    page: 1,
    pageSize: 24,
    pageCount: 5,
    total: 120,
    ...overrides,
  }
}

describe('Pagination', () => {
  it('renders nothing when pageCount is 1', () => {
    const { container } = render(<Pagination pagination={makePagination({ pageCount: 1, total: 24 })} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when pageCount is 0', () => {
    const { container } = render(<Pagination pagination={makePagination({ pageCount: 0, total: 0 })} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the correct range text', () => {
    render(<Pagination pagination={makePagination({ page: 1, pageSize: 24, total: 60, pageCount: 3 })} />)
    expect(screen.getByText(/mostrando 1.+24.+60/i)).toBeInTheDocument()
  })

  it('shows correct range on a middle page', () => {
    render(<Pagination pagination={makePagination({ page: 2, pageSize: 24, total: 60, pageCount: 3 })} />)
    expect(screen.getByText(/mostrando 25.+48.+60/i)).toBeInTheDocument()
  })

  it('disables the "previous" button on page 1', () => {
    render(<Pagination pagination={makePagination({ page: 1, pageCount: 5 })} />)
    const prevBtn = screen.getByRole('button', { name: /página anterior/i })
    expect(prevBtn).toBeDisabled()
  })

  it('disables the "next" button on the last page', () => {
    render(<Pagination pagination={makePagination({ page: 5, pageCount: 5 })} />)
    const nextBtn = screen.getByRole('button', { name: /página siguiente/i })
    expect(nextBtn).toBeDisabled()
  })

  it('enables both buttons on a middle page', () => {
    render(<Pagination pagination={makePagination({ page: 3, pageCount: 5 })} />)
    expect(screen.getByRole('button', { name: /página anterior/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /página siguiente/i })).not.toBeDisabled()
  })
})
