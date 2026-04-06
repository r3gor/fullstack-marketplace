import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pendiente',    className: 'bg-amber-50  text-amber-700  ring-amber-200'  },
  processing: { label: 'Procesando',  className: 'bg-blue-50   text-blue-700   ring-blue-200'   },
  shipped:    { label: 'Enviado',     className: 'bg-cyan-50   text-cyan-700   ring-cyan-200'   },
  delivered:  { label: 'Entregado',   className: 'bg-green-50  text-green-700  ring-green-200'  },
  cancelled:  { label: 'Cancelado',   className: 'bg-red-50    text-red-700    ring-red-200'    },
}

interface Props {
  status: string
  className?: string
}

export function OrderStatusBadge({ status, className }: Props) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
