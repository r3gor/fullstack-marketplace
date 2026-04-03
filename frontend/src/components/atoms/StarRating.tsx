interface StarRatingProps {
  rating: number // 0-5
  maxStars?: number
  showValue?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({ rating, maxStars = 5, showValue, size = 'sm' }: StarRatingProps) {
  const starClass = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of ${maxStars}`}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating)
        const partial = !filled && i < rating

        return (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={starClass}
            aria-hidden="true"
          >
            {partial ? (
              <defs>
                <linearGradient id={`half-${i}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#d1d5db" />
                </linearGradient>
              </defs>
            ) : null}
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={filled ? '#f59e0b' : partial ? `url(#half-${i})` : '#d1d5db'}
              stroke="none"
            />
          </svg>
        )
      })}
      <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>
    </div>
  )
}