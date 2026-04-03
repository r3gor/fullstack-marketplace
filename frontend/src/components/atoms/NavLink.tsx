'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors hover:text-cyan-500 ${
        isActive ? 'text-cyan-600' : 'text-gray-600'
      }`}
    >
      {children}
    </Link>
  )
}
