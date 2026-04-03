import { Logo } from '@/src/components/atoms/Logo'
import { NavLinks } from '@/src/components/molecules/NavLinks'
import { SearchBar } from '@/src/components/molecules/SearchBar'
import { CartButton } from '@/src/components/molecules/CartButton'
import { AuthNav } from '@/src/components/molecules/AuthNav'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden md:flex">
          <NavLinks />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <SearchBar />
          </div>
          <CartButton />
          <AuthNav />
        </div>
      </div>
    </header>
  )
}
