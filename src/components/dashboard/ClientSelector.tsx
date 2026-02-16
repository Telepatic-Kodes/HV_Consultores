'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronsUpDown, Check, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useClientContext } from './ClientContext'

export function ClientSelector() {
  const { activeClientId, activeClient, clients, setActiveClientId } = useClientContext()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  const filtered = search
    ? clients.filter(
        (c) =>
          c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
          c.rut.toLowerCase().includes(search.toLowerCase())
      )
    : clients

  const handleSelect = (clientId: string | null) => {
    setActiveClientId(clientId)
    setOpen(false)
    setSearch('')
    if (clientId) {
      router.push(`/dashboard/clientes/${clientId}`)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] justify-between h-9 bg-muted/30 border-transparent hover:border-primary/30 hover:bg-background text-sm font-normal"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {activeClient ? activeClient.razon_social : 'Todos los clientes'}
            </span>
          </div>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {/* Search */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Buscar cliente..."
            className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="ml-1 opacity-50 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <ScrollArea className="max-h-[280px]">
          <div className="p-1">
            {/* "Todos" option */}
            <button
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => handleSelect(null)}
            >
              <div className="h-5 w-5 rounded bg-muted flex items-center justify-center">
                <Building2 className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="font-medium">Todos los clientes</span>
              {!activeClientId && (
                <Check className="ml-auto h-4 w-4 text-primary" />
              )}
            </button>

            {/* Separator */}
            <div className="mx-2 my-1 h-px bg-border/60" />

            {/* Client list */}
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No se encontraron clientes
              </p>
            ) : (
              filtered.map((client) => (
                <button
                  key={client._id}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => handleSelect(client._id)}
                >
                  <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {client.razon_social.charAt(0)}
                    </span>
                  </div>
                  <div className="flex flex-col items-start truncate">
                    <span className="font-medium truncate w-full text-left">
                      {client.razon_social}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {client.rut}
                    </span>
                  </div>
                  {activeClientId === client._id && (
                    <Check className="ml-auto h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
