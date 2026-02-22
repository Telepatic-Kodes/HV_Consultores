'use client'

import Link from 'next/link'
import { Building2, Plus, Users } from 'lucide-react'
import { useClientContext } from './ClientContext'

export function ClientPicker() {
  const { clients, setActiveClientId } = useClientContext()

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Sin clientes</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Crea tu primer cliente para comenzar a trabajar con los módulos de la plataforma.
        </p>
        <Link
          href="/dashboard/clientes/nuevo"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-executive hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crear primer cliente
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Selecciona un cliente</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Elige la empresa con la que vas a trabajar
          </p>
        </div>
        <Link
          href="/dashboard/clientes/nuevo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-executive hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clients.map((client) => (
          <button
            key={client._id}
            onClick={() => setActiveClientId(client._id)}
            className="group relative text-left rounded-xl border border-border/40 bg-card p-5 hover:border-primary/30 hover:shadow-executive-md transition-all duration-200"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r from-primary/40 to-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {client.razon_social}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {client.rut}
                </p>
                {client.nombre_fantasia && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">
                    {client.nombre_fantasia}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
