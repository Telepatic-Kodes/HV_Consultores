'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Pencil,
  Trash2,
  GripVertical,
  Globe,
  User,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

interface RulesListProps {
  clienteId?: string
  onEdit: (rule: any) => void
}

const TIPO_LABELS: Record<string, string> = {
  contains: 'Contiene',
  regex: 'Regex',
  exact: 'Exacto',
  starts_with: 'Inicia',
}

const CAMPO_LABELS: Record<string, string> = {
  descripcion: 'Descripción',
  rut: 'RUT',
  razon_social: 'Razón Social',
  glosa: 'Glosa',
}

export function RulesList({ clienteId, onEdit }: RulesListProps) {
  const reglas = useQuery(api.templates.getReglasCategorizacion, {
    clienteId: clienteId ? (clienteId as Id<'clientes'>) : undefined,
  })
  const updateRegla = useMutation(api.templates.updateRegla)
  const deleteRegla = useMutation(api.templates.deleteRegla)
  const reorderReglas = useMutation(api.templates.reorderReglas)

  const handleToggle = async (reglaId: string, activa: boolean) => {
    await updateRegla({
      reglaId: reglaId as Id<'reglas_categorizacion'>,
      activa,
    })
  }

  const handleDelete = async (reglaId: string) => {
    await deleteRegla({
      reglaId: reglaId as Id<'reglas_categorizacion'>,
    })
  }

  const handleMoveUp = async (index: number) => {
    if (!reglas || index <= 0) return
    const ids = reglas.map((r) => r._id)
    const temp = ids[index]
    ids[index] = ids[index - 1]
    ids[index - 1] = temp
    await reorderReglas({ orderedIds: ids })
  }

  const handleMoveDown = async (index: number) => {
    if (!reglas || index >= reglas.length - 1) return
    const ids = reglas.map((r) => r._id)
    const temp = ids[index]
    ids[index] = ids[index + 1]
    ids[index + 1] = temp
    await reorderReglas({ orderedIds: ids })
  }

  if (!reglas) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-sm text-muted-foreground">
          Cargando reglas...
        </div>
      </div>
    )
  }

  if (reglas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium">Sin reglas de categorización</p>
        <p className="text-xs text-muted-foreground mt-1">
          Crea reglas para categorizar transacciones automáticamente
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">#</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Patrón</TableHead>
            <TableHead>Campo</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Alcance</TableHead>
            <TableHead>Usos</TableHead>
            <TableHead className="w-[60px]">Activa</TableHead>
            <TableHead className="w-[120px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reglas.map((regla, index) => (
            <TableRow key={regla._id}>
              <TableCell>
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-mono text-muted-foreground">
                    {regla.prioridad}
                  </span>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === reglas.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{regla.nombre}</p>
                  {regla.descripcion && (
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {regla.descripcion}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {TIPO_LABELS[regla.tipo_patron] || regla.tipo_patron}
                  </Badge>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded max-w-[120px] truncate">
                    {regla.patron}
                  </code>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs">
                  {CAMPO_LABELS[regla.campo_aplicacion] || regla.campo_aplicacion}
                </span>
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
                {regla.es_global ? (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                    <Globe className="h-3 w-3 mr-1" />
                    Global
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-[10px]">
                    <User className="h-3 w-3 mr-1" />
                    Cliente
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs font-mono">
                  {regla.veces_aplicada ?? 0}
                </span>
              </TableCell>
              <TableCell>
                <Switch
                  checked={regla.activa !== false}
                  onCheckedChange={(v) => handleToggle(regla._id, v)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit(regla)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(regla._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
