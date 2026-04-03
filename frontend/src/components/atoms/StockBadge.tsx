interface StockBadgeProps {
  availabilityStatus: string | null
  stock: number | null
}

export function StockBadge({ availabilityStatus, stock }: StockBadgeProps) {
  const inStock = availabilityStatus?.toLowerCase() !== 'out of stock'

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2 w-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-400'}`} />
      <span className={inStock ? 'text-green-700' : 'text-red-600'}>
        {inStock
          ? `En stock${stock ? ` · ${stock} disponibles` : ''}`
          : 'Sin stock'}
      </span>
    </div>
  )
}
