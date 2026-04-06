import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error = false, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-gray-400',
        'bg-white outline-none transition-colors',
        'focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
          : 'border-gray-300',
        className,
      )}
      {...props}
    />
  )
}
