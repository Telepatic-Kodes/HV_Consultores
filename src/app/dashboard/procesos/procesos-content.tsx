'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KPICard } from '@/components/dashboard'
import { useClientContext } from '@/components/dashboard/ClientContext'
import { ProcesoCard } from '@/components/procesos/ProcesoCard'
import { CreateProcesoDialog } from '@/components/procesos/CreateProcesoDialog'
import {
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  ListTodo,
  Plus,
  Search,
  Loader2,
} from 'lucide-react'
import { createProceso, crearDesdePlantilla, seedPlantillas } from './actions'

interface ProcesosContentProps {
  procesos: any[]
  stats: {
    procesosActivos: number
    procesosCompletados: number
    tareasVencidas: number
    totalTareas: number
  }
  plantillas: any[]
  clientes: any[]
}

const tipoOptions = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'contabilidad_mensual', label: 'Contabilidad Mensual' },
  { value: 'declaracion_f29', label: 'Declaración F29' },
  { value: 'declaracion_renta', label: 'Declaración Renta' },
  { value: 'cierre_anual', label: 'Cierre Anual' },
  { value: 'onboarding_cliente', label: 'Onboarding' },
  { value: 'otro', label: 'Otro' },
]

const estadoOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'activo', label: 'Activos' },
  { value: 'pausado', label: 'Pausados' },
  { value: 'completado', label: 'Completados' },
  { value: 'cancelado', label: 'Cancelados' },
]

export function ProcesosContent({ procesos, stats, plantillas, clientes }: ProcesosContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { activeClientId } = useClientContext()

  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('all')
  const [estadoFilter, setEstadoFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Build a map of cliente names
  const clienteMap = new Map<string, string>()
  for (const c of clientes) {
    clienteMap.set(c._id, c.razon_social)
  }

  // Filter procesos
  let filtered = procesos
  if (activeClientId) {
    filtered = filtered.filter((p) => p.cliente_id === activeClientId)
  }
  if (tipoFilter !== 'all') {
    filtered = filtered.filter((p) => p.tipo === tipoFilter)
  }
  if (estadoFilter !== 'all') {
    filtered = filtered.filter((p) => p.estado === estadoFilter)
  }
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (clienteMap.get(p.cliente_id) || '').toLowerCase().includes(q)
    )
  }

  const handleCreateFromScratch = async (data: any) => {
    await createProceso(data)
    startTransition(() => router.refresh())
  }

  const handleCreateFromTemplate = async (data: any) => {
    await crearDesdePlantilla(data)
    startTransition(() => router.refresh())
  }

  const handleSeed = async () => {
    setSeeding(true)
    await seedPlantillas()
    setSeeding(false)
    startTransition(() => router.refresh())
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Procesos Activos"
          value={stats.procesosActivos}
          description="Procesos en curso"
          icon={<ClipboardList className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="Completados"
          value={stats.procesosCompletados}
          description="Procesos finalizados"
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="Tareas Vencidas"
          value={stats.tareasVencidas}
          description="Tareas fuera de plazo"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />
        <KPICard
          title="Total Tareas"
          value={stats.totalTareas}
          description="En todos los procesos"
          icon={<ListTodo className="h-5 w-5" />}
          color="violet"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar procesos..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tipoOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {estadoOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          {plantillas.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
              {seeding && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Cargar Plantillas
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Proceso
          </Button>
        </div>
      </div>

      {/* Process Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay procesos{search || tipoFilter !== 'all' || estadoFilter !== 'all' ? ' que coincidan con los filtros' : ''}</p>
          <p className="text-xs mt-1">Crea un nuevo proceso para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((proceso) => (
            <ProcesoCard
              key={proceso._id}
              proceso={proceso}
              clienteNombre={clienteMap.get(proceso.cliente_id)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateProcesoDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        plantillas={plantillas}
        clientes={clientes}
        onCreateFromScratch={handleCreateFromScratch}
        onCreateFromTemplate={handleCreateFromTemplate}
      />
    </div>
  )
}
