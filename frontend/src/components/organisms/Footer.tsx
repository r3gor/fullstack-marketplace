import Link from 'next/link'
import { Logo } from '@/src/components/atoms/Logo'
import { NavLinks } from '@/src/components/molecules/NavLinks'

const legalLinks = [
  { href: '/shipping-policy', label: 'Envíos' },
  { href: '/terms', label: 'Términos' },
  { href: '/about', label: 'Nosotros' },
]

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Logo />
          <NavLinks />
          <nav className="flex gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} FS ECommerce. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
