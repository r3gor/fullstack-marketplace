interface PriceDisplayProps {
  price: number
  discountPercentage?: number | null
  className?: string
}

export function PriceDisplay({ price, discountPercentage, className = '' }: PriceDisplayProps) {
  const hasDiscount = discountPercentage && discountPercentage > 0
  const originalPrice = hasDiscount ? price / (1 - discountPercentage / 100) : null

  const format = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="text-lg font-bold text-gray-900">{format(price)}</span>
      {originalPrice && (
        <span className="text-sm text-gray-400 line-through">{format(originalPrice)}</span>
      )}
    </div>
  )
}
