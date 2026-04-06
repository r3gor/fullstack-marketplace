'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { user as userApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/lib/stores'
import { FormField } from '@/components/molecules/FormField'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import type { UserResponse } from '@/lib/api/types'

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
})

type FormValues = z.infer<typeof schema>

interface ProfileFormProps {
  initialData: UserResponse
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const setUser = useAuthStore((s) => s.setUser)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialData.name, email: initialData.email },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const updated = await userApi.update(data)
      setUser(updated)
      toast.success('Perfil actualizado')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error inesperado'
      toast.error(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField
        label="Nombre"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? <Spinner size="sm" className="text-slate-950" /> : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
