interface PolicyCardProps {
  title: string
  text: string
  icon: string
}

export function PolicyCard({ title, text, icon }: PolicyCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <p className="mb-1 font-medium">
        <span className="mr-1">{icon}</span>
        {title}
      </p>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}
