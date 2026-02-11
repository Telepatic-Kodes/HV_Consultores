// @ts-nocheck — temporary: types need update after Convex migration
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { X, Filter, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface FilterCriteria {
  searchTerm: string
  estado: string
  tipo: string
  fechaInicio?: Date
  fechaFin?: Date
  montoMin?: number
  montoMax?: number
  nuboxOnly: boolean
}

interface DocumentAdvancedFiltersProps {
  onFiltersChange: (filters: FilterCriteria) => void
  onReset: () => void
}

export function DocumentAdvancedFilters({
  onFiltersChange,
  onReset,
}: DocumentAdvancedFiltersProps) {
  const [expanded, setExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterCriteria>({
    searchTerm: '',
    estado: 'all',
    tipo: 'all',
    nuboxOnly: false,
  })

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, searchTerm: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleEstadoChange = (value: string) => {
    const newFilters = { ...filters, estado: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleTipoChange = (value: string) => {
    const newFilters = { ...filters, tipo: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleFechaInicioChange = (date: Date | undefined) => {
    const newFilters = { ...filters, fechaInicio: date }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleFechaFinChange = (date: Date | undefined) => {
    const newFilters = { ...filters, fechaFin: date }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleMontoMinChange = (value: string) => {
    const newFilters = {
      ...filters,
      montoMin: value ? parseFloat(value) : undefined,
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleMontoMaxChange = (value: string) => {
    const newFilters = {
      ...filters,
      montoMax: value ? parseFloat(value) : undefined,
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleNuboxOnlyChange = () => {
    const newFilters = { ...filters, nuboxOnly: !filters.nuboxOnly }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      estado: 'all',
      tipo: 'all',
      nuboxOnly: false,
    })
    setExpanded(false)
    onReset()
  }

  const hasActiveFilters =
    filters.searchTerm ||
    filters.estado !== 'all' ||
    filters.tipo !== 'all' ||
    filters.fechaInicio ||
    filters.fechaFin ||
    filters.montoMin ||
    filters.montoMax ||
    filters.nuboxOnly

  return (
    <div className="space-y-4">
      {/* Basic Filters */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por nombre o folio..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {filters.searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2 top-2.5"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <Button
          variant={expanded ? 'default' : 'outline'}
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          <ChevronDown
            className={`h-4 w-4 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
        <Select value={filters.estado} onValueChange={handleEstadoChange}>
          <SelectTrigger size="sm" className="text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="validado">Validado</SelectItem>
            <SelectItem value="enviado_nubox">Enviado a Nubox</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.tipo} onValueChange={handleTipoChange}>
          <SelectTrigger size="sm" className="text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="factura">Factura</SelectItem>
            <SelectItem value="boleta">Boleta</SelectItem>
            <SelectItem value="nota_credito">Nota de Crédito</SelectItem>
            <SelectItem value="nota_debito">Nota de Débito</SelectItem>
            <SelectItem value="guia_despacho">Guía de Despacho</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="text-xs sm:text-sm"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {expanded && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium block mb-2">Fecha de Carga</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-start text-xs sm:text-sm"
                    >
                      {filters.fechaInicio
                        ? format(filters.fechaInicio, 'dd/MM/yyyy', { locale: es })
                        : 'Desde...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.fechaInicio}
                      onSelect={handleFechaInicioChange}
                      disabled={(date) =>
                        filters.fechaFin ? date > filters.fechaFin : false
                      }
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-start text-xs sm:text-sm"
                    >
                      {filters.fechaFin
                        ? format(filters.fechaFin, 'dd/MM/yyyy', { locale: es })
                        : 'Hasta...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={filters.fechaFin}
                      onSelect={handleFechaFinChange}
                      disabled={(date) =>
                        filters.fechaInicio ? date < filters.fechaInicio : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label className="text-sm font-medium block mb-2">Rango de Monto</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Monto mín"
                  value={filters.montoMin || ''}
                  onChange={(e) => handleMontoMinChange(e.target.value)}
                  className="text-xs"
                />
                <Input
                  type="number"
                  placeholder="Monto máx"
                  value={filters.montoMax || ''}
                  onChange={(e) => handleMontoMaxChange(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Nubox Filter */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="nubox-only"
              checked={filters.nuboxOnly}
              onChange={handleNuboxOnlyChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="nubox-only" className="ml-2 text-sm text-muted-foreground">
              Solo documentos enviados a Nubox
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
