'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserCircleIcon, FavouriteIcon, PackageIcon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/account', label: 'Mi perfil', icon: UserCircleIcon },
  { href: '/account/favorites', label: 'Favoritos', icon: FavouriteIcon },
  { href: '/account/orders', label: 'Mis pedidos', icon: PackageIcon },
]

export function AccountSidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-60 lg:shrink-0">
      {/* User info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-semibold text-slate-900 truncate">{user?.name ?? '—'}</p>
        <p className="text-sm text-slate-500 truncate">{user?.email ?? '—'}</p>
      </div>

      <Separator className="hidden lg:block" />

      {/* Navigation */}
      <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-cyan-50 text-cyan-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <HugeiconsIcon icon={icon} size={18} color="currentColor" strokeWidth={1.5} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
