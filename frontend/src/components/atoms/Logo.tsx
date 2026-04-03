import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
      <span className="text-indigo-600">FS</span>
      <span>ECommerce</span>
    </Link>
  )
}
