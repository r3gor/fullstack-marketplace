const BENEFITS = [
  {
    icon: '🚚',
    title: 'Envíos gratis',
    description: 'En compras mayores a $50',
  },
  {
    icon: '↩️',
    title: 'Devoluciones fáciles',
    description: 'Hasta 30 días sin costo',
  },
  {
    icon: '🔒',
    title: 'Pago seguro',
    description: 'Encriptación SSL en todo momento',
  },
  {
    icon: '💬',
    title: 'Soporte 24/7',
    description: 'Estamos aquí para ayudarte',
  },
]

export function PromoBanner() {
  return (
    <section className="border-y border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex flex-col items-center gap-2 text-center">
              <span className="text-2xl" aria-hidden="true">{benefit.icon}</span>
              <p className="text-sm font-semibold text-slate-900">{benefit.title}</p>
              <p className="text-xs text-slate-500">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
