import { NavLink } from '@/components/atoms/NavLink'

const links = [
  { href: '/products', label: 'Productos' },
  { href: '/categories', label: 'Categorías' },
  { href: '/about', label: 'Nosotros' },
]

interface NavLinksProps {
  orientation?: 'horizontal' | 'vertical'
}

export function NavLinks({ orientation = 'horizontal' }: NavLinksProps) {
  return (
    <nav
      className={`flex gap-6 ${orientation === 'vertical' ? 'flex-col' : 'flex-row items-center'}`}
    >
      {links.map((link) => (
        <NavLink key={link.href} href={link.href}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
