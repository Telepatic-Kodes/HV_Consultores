'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Plus,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit2,
  Trash2,
  X,
  User,
  Clock,
  FlaskConical,
  FileText,
  Bot,
  Landmark,
} from 'lucide-react'
import Link from 'next/link'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { crearCliente, actualizarCliente, desactivarCliente } from './actions'
import type { ClienteConStats, ClienteStats } from './actions'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ClientesContentProps {
  clientes: ClienteConStats[]
  stats: ClienteStats
  contadores: Profile[]
}

const regimenes = [
  { value: '14A', label: '14A - Régimen General' },
  { value: '14D', label: '14D - Pro Pyme' },
  { value: '14D_N3', label: '14D N°3 - Pro Pyme General' },
  { value: '14D_N8', label: '14D N°8 - Pro Pyme Transparente' },
]

export function ClientesContent({ clientes, stats, contadores }: ClientesContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filtro, setFiltro] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<ClienteConStats | null>(null)
  const [formData, setFormData] = useState({
    razon_social: '',
    rut: '',
    regimen_tributario: '14D',
    contador_asignado_id: '',
    giro: '',
    direccion: '',
    comuna: '',
    region: '',
    nombre_fantasia: '',
    tasa_ppm: '',
  })
  const [error, setError] = useState('')

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.razon_social.toLowerCase().includes(filtro.toLowerCase()) ||
      c.rut.toLowerCase().includes(filtro.toLowerCase())
  )

  const handleOpenModal = (cliente?: ClienteConStats) => {
    if (cliente) {
      setEditando(cliente)
      setFormData({
        razon_social: cliente.razon_social,
        rut: cliente.rut,
        regimen_tributario: cliente.regimen_tributario || '14D',
        contador_asignado_id: cliente.contador_asignado_id || '',
        giro: cliente.giro || '',
        direccion: cliente.direccion || '',
        comuna: cliente.comuna || '',
        region: cliente.region || '',
        nombre_fantasia: cliente.nombre_fantasia || '',
        tasa_ppm: cliente.tasa_ppm?.toString() || '',
      })
    } else {
      setEditando(null)
      setFormData({
        razon_social: '',
        rut: '',
        regimen_tributario: '14D',
        contador_asignado_id: '',
        giro: '',
        direccion: '',
        comuna: '',
        region: '',
        nombre_fantasia: '',
        tasa_ppm: '',
      })
    }
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.razon_social.trim() || !formData.rut.trim()) {
      setError('Razón Social y RUT son obligatorios')
      return
    }

    startTransition(async () => {
      if (editando) {
        const result = await actualizarCliente(editando.id, {
          razon_social: formData.razon_social,
          regimen_tributario: formData.regimen_tributario,
          contador_asignado_id: formData.contador_asignado_id || null,
          giro: formData.giro,
          direccion: formData.direccion,
          comuna: formData.comuna,
          region: formData.region,
          nombre_fantasia: formData.nombre_fantasia,
          tasa_ppm: formData.tasa_ppm ? parseFloat(formData.tasa_ppm) : undefined,
        })

        if (!result.success) {
          setError(result.error || 'Error al actualizar cliente')
          return
        }
      } else {
        const result = await crearCliente({
          razon_social: formData.razon_social,
          rut: formData.rut,
          regimen_tributario: formData.regimen_tributario,
          contador_asignado_id: formData.contador_asignado_id || undefined,
          giro: formData.giro,
          direccion: formData.direccion,
          comuna: formData.comuna,
          region: formData.region,
          nombre_fantasia: formData.nombre_fantasia,
          tasa_ppm: formData.tasa_ppm ? parseFloat(formData.tasa_ppm) : undefined,
        })

        if (!result.success) {
          setError(result.error || 'Error al crear cliente')
          return
        }
      }

      setShowModal(false)
    })
  }

  const handleDelete = async (cliente: ClienteConStats) => {
    if (!confirm(`¿Estás seguro de desactivar a ${cliente.razon_social}?`)) return

    startTransition(async () => {
      await desactivarCliente(cliente.id)
    })
  }

  return (
    <main className="p-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Gestion de Clientes
        </span>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Buscar por RUT o razon social..."
            className="pl-10 h-11 bg-muted/30 border-transparent focus:border-primary/30 focus:bg-background"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        <Link href="/dashboard/clientes/nuevo">
          <Button className="shadow-executive">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.activos}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Clientes Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-success/10 flex items-center justify-center ring-1 ring-success/20 group-hover:scale-105 transition-transform">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.f29AlDia}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">F29 Al Dia</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-warning/10 flex items-center justify-center ring-1 ring-warning/20 group-hover:scale-105 transition-transform">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.f29Pendiente}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">F29 Pendiente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-destructive/10 flex items-center justify-center ring-1 ring-destructive/20 group-hover:scale-105 transition-transform">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.f29Atrasado}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">F29 Atrasado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/50 shadow-executive">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Lista de Clientes</CardTitle>
              <CardDescription className="mt-1">
                {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''} activo
                {clientesFiltrados.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              Actualizado ahora
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {clientesFiltrados.length === 0 ? (
            filtro ? (
              <div className="py-16 text-center">
                <div className="h-14 w-14 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">No se encontraron clientes</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Intenta con otro termino de busqueda</p>
              </div>
            ) : (
              <WelcomeEmptyState />
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Razon Social</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Regimen</TableHead>
                  <TableHead>Contador</TableHead>
                  <TableHead>Estado F29</TableHead>
                  <TableHead className="text-center">Docs Pend.</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <TableRow
                    key={cliente.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/clientes/${cliente.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{cliente.razon_social}</p>
                        {cliente.nombre_fantasia && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cliente.nombre_fantasia}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-muted-foreground">{cliente.rut}</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
                        {cliente.regimen_tributario || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {cliente.contador ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="text-sm">{cliente.contador.nombre_completo}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-sm italic">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          cliente.estado_f29 === 'al_dia'
                            ? 'bg-success/10 text-success ring-success/20'
                            : cliente.estado_f29 === 'pendiente'
                            ? 'bg-warning/10 text-warning ring-warning/20'
                            : 'bg-destructive/10 text-destructive ring-destructive/20'
                        }`}
                      >
                        {cliente.estado_f29 === 'al_dia' && <CheckCircle className="h-3 w-3" />}
                        {cliente.estado_f29 === 'pendiente' && <Clock className="h-3 w-3" />}
                        {cliente.estado_f29 === 'atrasado' && <AlertCircle className="h-3 w-3" />}
                        {cliente.estado_f29 === 'al_dia'
                          ? 'Al dia'
                          : cliente.estado_f29 === 'pendiente'
                          ? 'Pendiente'
                          : 'Atrasado'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {cliente.documentos_pendientes > 0 ? (
                        <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-warning/10 text-warning text-xs font-bold">
                          {cliente.documentos_pendientes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenModal(cliente)
                          }}
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(cliente)
                          }}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Welcome Empty State Modal-level component defined below */}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-executive-lg w-full max-w-2xl max-h-[90vh] overflow-auto m-4 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {editando ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editando ? 'Modifica los datos del cliente' : 'Completa la informacion del nuevo cliente'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section: Identificacion */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identificacion</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Razon Social <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.razon_social}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, razon_social: e.target.value }))
                      }
                      placeholder="Empresa SpA"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      RUT <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.rut}
                      onChange={(e) => setFormData((prev) => ({ ...prev, rut: e.target.value }))}
                      placeholder="76.123.456-7"
                      disabled={!!editando}
                      className="h-11 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Nombre Fantasia</label>
                    <Input
                      value={formData.nombre_fantasia}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nombre_fantasia: e.target.value }))
                      }
                      placeholder="Nombre comercial"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Tributario */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configuración Tributaria</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Regimen Tributario</label>
                    <select
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      value={formData.regimen_tributario}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, regimen_tributario: e.target.value }))
                      }
                    >
                      {regimenes.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contador Asignado</label>
                    <select
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      value={formData.contador_asignado_id}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, contador_asignado_id: e.target.value }))
                      }
                    >
                      <option value="">Sin asignar</option>
                      {contadores.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Giro</label>
                    <Input
                      value={formData.giro}
                      onChange={(e) => setFormData((prev) => ({ ...prev, giro: e.target.value }))}
                      placeholder="Servicios de consultoria"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tasa PPM (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tasa_ppm}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, tasa_ppm: e.target.value }))
                      }
                      placeholder="0.25"
                      className="h-11 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Ubicacion */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ubicacion</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Direccion</label>
                    <Input
                      value={formData.direccion}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, direccion: e.target.value }))
                      }
                      placeholder="Av. Principal 123"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Comuna</label>
                    <Input
                      value={formData.comuna}
                      onChange={(e) => setFormData((prev) => ({ ...prev, comuna: e.target.value }))}
                      placeholder="Santiago"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Region</label>
                    <Input
                      value={formData.region}
                      onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
                      placeholder="Metropolitana"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-5 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="px-5"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="px-5 shadow-executive">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : editando ? (
                    'Guardar Cambios'
                  ) : (
                    'Crear Cliente'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

function WelcomeEmptyState() {
  const seedDemoData = useMutation(api.seed.seedDemoData)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedDone, setSeedDone] = useState(false)
  const router = useRouter()

  const handleSeed = async () => {
    setSeedLoading(true)
    try {
      await seedDemoData()
      setSeedDone(true)
      setTimeout(() => router.refresh(), 500)
    } catch {
      // data may already exist
    }
    setSeedLoading(false)
  }

  if (seedDone) {
    return (
      <div className="py-16 text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Datos de ejemplo cargados</p>
        <p className="text-sm text-muted-foreground mt-1">
          Se crearon 3 empresas con documentos, F29, transacciones y mas. Recargando...
        </p>
      </div>
    )
  }

  return (
    <div className="py-12 px-6">
      <div className="max-w-lg mx-auto text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Bienvenido a HV Consultores
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Comienza registrando tu primer cliente para activar todos los modulos de la plataforma.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Link href="/dashboard/clientes/nuevo">
            <Button size="lg" className="shadow-executive">
              <Plus className="mr-2 h-4 w-4" />
              Registrar primer cliente
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={handleSeed}
            disabled={seedLoading}
          >
            {seedLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="mr-2 h-4 w-4" />
            )}
            Cargar datos de ejemplo
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <div className="h-9 w-9 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
              <FileText className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">Gestión Tributaria</p>
            <p className="text-xs text-muted-foreground mt-1">F29, documentos y clasificación IA</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <div className="h-9 w-9 mx-auto rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
              <Landmark className="h-4.5 w-4.5 text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">Conciliación Bancaria</p>
            <p className="text-xs text-muted-foreground mt-1">Match automático banco-documentos</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <div className="h-9 w-9 mx-auto rounded-lg bg-violet-500/10 flex items-center justify-center mb-2">
              <Bot className="h-4.5 w-4.5 text-violet-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">Automatizacion IA</p>
            <p className="text-xs text-muted-foreground mt-1">Bots RPA y asistente inteligente</p>
          </div>
        </div>
      </div>
    </div>
  )
}
