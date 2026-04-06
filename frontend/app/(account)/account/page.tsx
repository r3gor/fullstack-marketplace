import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { serverUser } from '@/lib/api/server'
import { ProfileForm } from '@/components/organisms/ProfileForm'

export const metadata: Metadata = { title: 'Mi perfil' }

export default async function AccountPage() {
  let userData
  try {
    userData = await serverUser.me()
  } catch {
    redirect('/login')
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Mi perfil</h1>
      <p className="mb-6 text-sm text-slate-500">
        Actualiza tu nombre y dirección de email.
      </p>
      <ProfileForm initialData={userData} />
    </div>
  )
}
