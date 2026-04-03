interface BadgeProps {
  count: number
  className?: string
}

export function Badge({ count, className = '' }: BadgeProps) {
  if (count <= 0) return null

  return (
    <span
      className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
