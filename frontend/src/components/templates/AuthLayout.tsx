import { Providers } from '@/components/providers/Providers'
import { Logo } from '@/components/atoms/Logo'
import Link from 'next/link'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
        <div className="mb-8">
          <Link href="/" aria-label="Volver al inicio">
            <Logo />
          </Link>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </Providers>
  )
}
