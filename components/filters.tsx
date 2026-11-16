'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useRef } from 'react'
import { EXTRAS, OPERATIONS, SORTS, TYPES } from '@/lib/portal'

/**
 * Los filtros del buscador. No guardan estado propio: escriben en la URL y el servidor vuelve a
 * pintar los resultados, así que una búsqueda se puede compartir con un enlace.
 */
export function Filters({ zones }: { zones: Record<string, number> }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function update(change: (next: URLSearchParams) => void, wait = 0) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const next = new URLSearchParams(params)
      change(next)
      // Un filtro nuevo empieza siempre por la primera página.
      next.delete('page')
      router.replace(`${pathname}?${next}`, { scroll: false })
    }, wait)
  }

  const set = (name: string, wait = 0) => (value: string) =>
    update((next) => (value ? next.set(name, value) : next.delete(name)), wait)

  function toggleExtra(extra: string, on: boolean) {
    update((next) => {
      const extras = next.getAll('extras').filter((value) => value !== extra)
      next.delete('extras')
      for (const value of on ? [...extras, extra] : extras) next.append('extras', value)
    })
  }

  const operation = params.get('operation') ?? 'sale'
  const field = 'rounded border border-slate-300 bg-white px-2 py-1.5'

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(OPERATIONS).map(([value, text]) => (
          <button
            key={value}
            onClick={() => set('operation')(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${operation === value ? 'bg-teal-700 text-white' : 'bg-white ring-1 ring-slate-300 hover:bg-slate-100'}`}
          >
            {text}
          </button>
        ))}
        <input
          type="search"
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => set('q', 300)(e.target.value)}
          placeholder="Barrio, tipo o referencia"
          className="ml-auto w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-sm sm:w-64"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <select value={params.get('zone') ?? ''} onChange={(e) => set('zone')(e.target.value)} className={field}>
          <option value="">Toda Valencia</option>
          {Object.entries(zones).map(([zone, count]) => (
            <option key={zone} value={zone}>{zone} ({count})</option>
          ))}
        </select>
        <select value={params.get('type') ?? ''} onChange={(e) => set('type')(e.target.value)} className={field}>
          <option value="">Cualquier tipo</option>
          {Object.entries(TYPES).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
        </select>
        <input type="number" defaultValue={params.get('minPrice') ?? ''} onChange={(e) => set('minPrice', 500)(e.target.value)} placeholder="Precio mín." className={`w-28 ${field}`} />
        <input type="number" defaultValue={params.get('maxPrice') ?? ''} onChange={(e) => set('maxPrice', 500)(e.target.value)} placeholder="Precio máx." className={`w-28 ${field}`} />
        <select value={params.get('bedrooms') ?? ''} onChange={(e) => set('bedrooms')(e.target.value)} className={field}>
          <option value="">Dormitorios</option>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} o más</option>)}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        {Object.entries(EXTRAS).map(([value, text]) => (
          <label key={value} className="flex items-center gap-1.5">
            <input type="checkbox" checked={params.getAll('extras').includes(value)} onChange={(e) => toggleExtra(value, e.target.checked)} className="accent-teal-700" />
            {text}
          </label>
        ))}
        <select value={params.get('sort') ?? 'recent'} onChange={(e) => set('sort')(e.target.value)} className={`ml-auto ${field}`}>
          {Object.entries(SORTS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
        </select>
      </div>
    </>
  )
}
