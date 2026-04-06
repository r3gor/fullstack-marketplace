import type { Metadata } from 'next'
import { AccountLayout } from '@/components/templates/AccountLayout'

export const metadata: Metadata = {
  title: {
    template: '%s | Mi cuenta',
    default: 'Mi cuenta',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccountLayout>{children}</AccountLayout>
}
