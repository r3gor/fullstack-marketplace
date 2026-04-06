'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/lib/stores'
import { FormField } from '@/components/molecules/FormField'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    try {
      const user = await auth.register(data)
      setUser(user)
      toast.success('¡Cuenta creada! Bienvenido.')
      router.push('/account')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error inesperado'
      toast.error(message)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">Empieza a comprar hoy</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField
          label="Nombre"
          type="text"
          autoComplete="name"
          placeholder="Tu nombre"
          error={errors.name?.message}
          {...register('name')}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" disabled={isSubmitting} size="lg" className="mt-2 w-full">
          {isSubmitting ? <Spinner size="sm" className="text-slate-950" /> : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-cyan-600 hover:text-cyan-500">
          Inicia sesión
        </Link>
      </p>
    </>
  )
}
