// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, FlaskConical } from 'lucide-react'

type TipoPatron = 'contains' | 'regex' | 'exact' | 'starts_with'
type CampoAplicacion = 'descripcion' | 'rut' | 'razon_social' | 'glosa'

interface RuleEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId?: string
  editingRule?: any
  onSaved: () => void
}

const TIPO_PATRON_LABELS: Record<TipoPatron, string> = {
  contains: 'Contiene',
  regex: 'Expresión Regular',
  exact: 'Exacto',
  starts_with: 'Comienza con',
}

const CAMPO_LABELS: Record<CampoAplicacion, string> = {
  descripcion: 'Descripción',
  rut: 'RUT',
  razon_social: 'Razón Social',
  glosa: 'Glosa',
}

export function RuleEditor({
  open,
  onOpenChange,
  clienteId,
  editingRule,
  onSaved,
}: RuleEditorProps) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [patron, setPatron] = useState('')
  const [tipoPatron, setTipoPatron] = useState<TipoPatron>('contains')
  const [campoAplicacion, setCampoAplicacion] =
    useState<CampoAplicacion>('descripcion')
  const [categoria, setCategoria] = useState('')
  const [prioridad, setPrioridad] = useState(10)
  const [esGlobal, setEsGlobal] = useState(!clienteId)
  const [testTexts, setTestTexts] = useState('')
  const [testResults, setTestResults] = useState<
    { texto: string; matches: boolean }[]
  >([])

  const createRegla = useMutation(api.templates.createRegla)
  const updateRegla = useMutation(api.templates.updateRegla)
  const testPatternQuery = useQuery(
    api.templates.testPattern,
    testTexts.trim()
      ? {
          patron,
          tipo_patron: tipoPatron,
          textosPrueba: testTexts
            .split('\n')
            .filter((t) => t.trim()),
        }
      : 'skip'
  )

  useEffect(() => {
    if (testPatternQuery) {
      setTestResults(testPatternQuery)
    }
  }, [testPatternQuery])

  useEffect(() => {
    if (editingRule) {
      setNombre(editingRule.nombre || '')
      setDescripcion(editingRule.descripcion || '')
      setPatron(editingRule.patron || '')
      setTipoPatron(editingRule.tipo_patron || 'contains')
      setCampoAplicacion(editingRule.campo_aplicacion || 'descripcion')
      setCategoria(editingRule.categoria || '')
      setPrioridad(editingRule.prioridad ?? 10)
      setEsGlobal(editingRule.es_global ?? false)
    } else {
      setNombre('')
      setDescripcion('')
      setPatron('')
      setTipoPatron('contains')
      setCampoAplicacion('descripcion')
      setCategoria('')
      setPrioridad(10)
      setEsGlobal(!clienteId)
      setTestTexts('')
      setTestResults([])
    }
  }, [editingRule, clienteId, open])

  const handleSave = async () => {
    if (!nombre || !patron) return

    if (editingRule) {
      await updateRegla({
        reglaId: editingRule._id,
        nombre,
        descripcion: descripcion || undefined,
        patron,
        tipo_patron: tipoPatron,
        campo_aplicacion: campoAplicacion,
        categoria: categoria || undefined,
        prioridad,
        activa: true,
      })
    } else {
      await createRegla({
        clienteId: clienteId
          ? (clienteId as Id<'clientes'>)
          : undefined,
        nombre,
        descripcion: descripcion || undefined,
        patron,
        tipo_patron: tipoPatron,
        campo_aplicacion: campoAplicacion,
        categoria: categoria || undefined,
        prioridad,
        es_global: esGlobal,
      })
    }

    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? 'Editar Regla' : 'Nueva Regla de Categorización'}
          </DialogTitle>
          <DialogDescription>
            Define un patrón para categorizar transacciones automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre-regla">Nombre</Label>
            <Input
              id="nombre-regla"
              placeholder="Ej: Pagos Enel"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          {/* Descripcion */}
          <div className="space-y-2">
            <Label htmlFor="desc-regla">Descripción (opcional)</Label>
            <Textarea
              id="desc-regla"
              placeholder="Descripción de la regla..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
            />
          </div>

          {/* Patron + tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de patrón</Label>
              <Select
                value={tipoPatron}
                onValueChange={(v) => setTipoPatron(v as TipoPatron)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_PATRON_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Campo</Label>
              <Select
                value={campoAplicacion}
                onValueChange={(v) =>
                  setCampoAplicacion(v as CampoAplicacion)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CAMPO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patron">Patrón</Label>
            <Input
              id="patron"
              placeholder={
                tipoPatron === 'regex'
                  ? 'Ej: ENEL.*PAGO'
                  : 'Ej: PAGO ENEL'
              }
              value={patron}
              onChange={(e) => setPatron(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Categoría + Prioridad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                placeholder="Ej: servicios_basicos"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Input
                id="prioridad"
                type="number"
                min={1}
                max={999}
                value={prioridad}
                onChange={(e) => setPrioridad(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Global toggle */}
          {!clienteId && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Regla global</p>
                <p className="text-xs text-muted-foreground">
                  Aplica a todos los clientes
                </p>
              </div>
              <Switch checked={esGlobal} onCheckedChange={setEsGlobal} />
            </div>
          )}

          {/* Pattern tester */}
          <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Probar patrón</Label>
            </div>
            <Textarea
              placeholder="Ingresa textos de prueba (uno por línea)..."
              value={testTexts}
              onChange={(e) => setTestTexts(e.target.value)}
              rows={3}
              className="text-sm font-mono"
            />
            {testResults.length > 0 && (
              <div className="space-y-1 pt-1">
                {testResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs"
                  >
                    {r.matches ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span
                      className={
                        r.matches ? 'text-emerald-600' : 'text-muted-foreground'
                      }
                    >
                      {r.texto}
                    </span>
                    <Badge
                      className={
                        r.matches
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]'
                          : 'bg-red-100 text-red-700 border-red-200 text-[10px]'
                      }
                    >
                      {r.matches ? 'Match' : 'No match'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!nombre || !patron}>
            {editingRule ? 'Guardar cambios' : 'Crear regla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
