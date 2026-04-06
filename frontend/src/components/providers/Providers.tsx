'use client'

import { Toaster } from 'sonner'
import { AuthInitializer } from './AuthInitializer'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthInitializer />
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}
