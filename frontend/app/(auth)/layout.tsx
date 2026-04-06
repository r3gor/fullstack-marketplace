import type { Metadata } from 'next'
import { AuthLayout } from '@/components/templates/AuthLayout'

export const metadata: Metadata = {
  title: {
    template: '%s | FS ECommerce',
    default: 'Acceso',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>
}
