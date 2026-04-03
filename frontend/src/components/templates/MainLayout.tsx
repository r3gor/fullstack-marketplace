import { Providers } from '@/src/components/providers/Providers'
import { Header } from '@/src/components/organisms/Header'
import { Footer } from '@/src/components/organisms/Footer'
import { CartDrawer } from '@/src/components/organisms/CartDrawer'

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
