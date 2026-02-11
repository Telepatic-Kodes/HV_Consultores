// @ts-nocheck
'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface AccountMappingTableProps {
  clienteId: string
}

export function AccountMappingTable({ clienteId }: AccountMappingTableProps) {
  const reglas = useQuery(api.templates.getReglasCategorizacion, {
    clienteId: clienteId as Id<'clientes'>,
    soloActivas: true,
  })

  if (!reglas) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const reglasConCuenta = reglas.filter((r) => r.cuenta_contable_id || r.categoria)

  if (reglasConCuenta.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium">Sin mapeos configurados</p>
        <p className="text-xs text-muted-foreground mt-1">
          Crea reglas de categorización con cuentas contables asignadas
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Regla</TableHead>
            <TableHead>Patrón</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Cuenta Contable</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Aplicaciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reglasConCuenta.map((regla) => (
            <TableRow key={regla._id}>
              <TableCell>
                <span className="text-sm font-medium">{regla.nombre}</span>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {regla.patron}
                </code>
              </TableCell>
              <TableCell>
                {regla.categoria ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {regla.categoria}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {regla.cuenta_contable_id ? (
                  <span className="text-xs font-mono">
                    {regla.cuenta_contable_id}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs font-mono">{regla.prioridad}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs">{regla.veces_aplicada ?? 0}x</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
