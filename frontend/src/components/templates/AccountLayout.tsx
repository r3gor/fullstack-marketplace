import { Providers } from '@/components/providers/Providers'
import { Header } from '@/components/organisms/Header'
import { Footer } from '@/components/organisms/Footer'
import { AccountSidebar } from '@/components/organisms/AccountSidebar'

export function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Header />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <AccountSidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </Providers>
  )
}
