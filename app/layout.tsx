import type { Metadata } from 'next'
import Link from 'next/link'
import { PORTAL } from '@/lib/portal'
import './globals.css'

export const metadata: Metadata = {
  title: { template: `%s · ${PORTAL}`, default: `Pisos y casas en Valencia · ${PORTAL}` },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <nav className="flex h-14 items-center gap-6 px-4">
            <Link href="/" className="text-xl font-bold text-teal-700">{PORTAL}</Link>
            <Link href="/?operation=sale" className="text-sm hover:text-teal-700">Comprar</Link>
            <Link href="/?operation=rent" className="text-sm hover:text-teal-700">Alquilar</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
