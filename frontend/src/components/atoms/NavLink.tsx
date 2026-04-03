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
      className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
        isActive ? 'text-indigo-600' : 'text-gray-600'
      }`}
    >
      {children}
    </Link>
  )
}
