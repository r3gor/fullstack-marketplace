import { Providers } from '@/components/providers/Providers'
import { Header } from '@/components/organisms/Header'
import { Footer } from '@/components/organisms/Footer'
import { CartDrawer } from '@/components/organisms/CartDrawer'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </Providers>
  )
}
