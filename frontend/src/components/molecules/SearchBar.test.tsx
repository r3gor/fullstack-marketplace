import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

beforeEach(() => {
  mockPush.mockClear()
})

describe('SearchBar', () => {
  it('renders an input and a submit button', () => {
    render(<SearchBar />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument()
  })

  it('does NOT navigate when the query is empty', async () => {
    render(<SearchBar />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does NOT navigate when the query contains only spaces', async () => {
    render(<SearchBar />)
    await userEvent.type(screen.getByRole('searchbox'), '   ')
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('navigates to /search with the encoded query', async () => {
    render(<SearchBar />)
    await userEvent.type(screen.getByRole('searchbox'), 'iphone 15')
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    expect(mockPush).toHaveBeenCalledWith('/search?q=iphone%2015')
  })

  it('strips dangerous characters before navigating', async () => {
    render(<SearchBar />)
    await userEvent.type(screen.getByRole('searchbox'), '<script>xss</script>')
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    expect(mockPush).toHaveBeenCalled()
    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('<')
    expect(url).not.toContain('>')
  })
})
