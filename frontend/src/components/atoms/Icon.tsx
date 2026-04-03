interface IconProps {
  children: React.ReactNode
  size?: number
  className?: string
}

export function Icon({ children, size = 20, className = '' }: IconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  )
}
