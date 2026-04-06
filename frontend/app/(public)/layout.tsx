import { MainLayout } from '@/components/templates/MainLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>
}
