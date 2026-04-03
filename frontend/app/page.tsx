import { HeroSection } from '@/components/organisms/HeroSection'
import { FeaturedProducts } from '@/components/organisms/FeaturedProducts'
import { FeaturedCategories } from '@/components/organisms/FeaturedCategories'
import { PromoBanner } from '@/components/organisms/PromoBanner'

export const revalidate = false // SSG — regenerate on deploy

export const metadata = {
  title: 'FS ECommerce — Tu tienda de confianza',
  description: 'Encuentra los mejores productos de electrónica, moda, hogar y más. Envíos rápidos y devoluciones sin costo.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <FeaturedCategories />
      <PromoBanner />
    </>
  )
}
