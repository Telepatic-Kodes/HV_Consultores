'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Lightbulb, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import {
  obtenerSugerenciasInteligentes,
  responderSugerencia,
  type SmartSuggestion,
} from '@/app/dashboard/documentos/intelligence-actions'

interface SmartSuggestionsWidgetProps {
  clienteId: string
  tipoSugerencia?: string
}

export function SmartSuggestionsWidget({
  clienteId,
  tipoSugerencia,
}: SmartSuggestionsWidgetProps) {
  const [sugerencias, setSugerencias] = useState<SmartSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)

  useEffect(() => {
    cargarSugerencias()
  }, [clienteId, tipoSugerencia])

  const cargarSugerencias = async () => {
    setLoading(true)
    try {
      const resultado = await obtenerSugerenciasInteligentes(clienteId, tipoSugerencia)
      if (resultado.success && resultado.sugerencias) {
        setSugerencias(resultado.sugerencias)
      }
    } catch (error) {
      toast.error('Error al cargar sugerencias')
    } finally {
      setLoading(false)
    }
  }

  const handleResponder = async (sugerenciaId: string, aceptada: boolean) => {
    setProcesando(sugerenciaId)
    try {
      const resultado = await responderSugerencia(sugerenciaId, aceptada)
      if (resultado.success) {
        toast.success(aceptada ? 'Sugerencia aceptada' : 'Sugerencia rechazada')
        cargarSugerencias()
      } else {
        toast.error(resultado.error || 'Error al procesar sugerencia')
      }
    } finally {
      setProcesando(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Sugerencias Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sugerencias.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Sugerencias Inteligentes
          </CardTitle>
          <CardDescription>No hay sugerencias en este momento</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const obtenerIconoTipo = (tipo: string) => {
    const tipos: Record<string, { label: string; color: string }> = {
      template: { label: 'Plantilla', color: 'bg-blue-100 text-blue-800' },
      folio: { label: 'Folio', color: 'bg-purple-100 text-purple-800' },
      amount: { label: 'Monto', color: 'bg-green-100 text-green-800' },
      category: { label: 'Categoría', color: 'bg-orange-100 text-orange-800' },
    }
    return tipos[tipo] || { label: tipo, color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Sugerencias Inteligentes
          </div>
          <Badge variant="secondary">{sugerencias.length} nuevas</Badge>
        </CardTitle>
        <CardDescription>
          Recomendaciones basadas en tus patrones de uso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sugerencias.slice(0, 5).map((s) => {
          const tipo = obtenerIconoTipo(s.tipo_sugerencia)
          return (
            <div key={s.id} className="border rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={tipo.color}>{tipo.label}</Badge>
                    <Badge variant="outline">{(s.confianza * 100).toFixed(0)}% confianza</Badge>
                  </div>
                  <p className="text-sm font-medium mt-2">{s.sugerencia_texto}</p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-muted/50 p-2 rounded text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Razón:</span>{' '}
                  <span className="font-medium">{s.razon}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Basado en:</span>{' '}
                  <span className="font-medium capitalize">{s.basado_en}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleResponder(s.id, true)}
                  disabled={procesando === s.id}
                >
                  {procesando === s.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-1" />
                  )}
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => handleResponder(s.id, false)}
                  disabled={procesando === s.id}
                >
                  {procesando === s.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ThumbsDown className="h-4 w-4 mr-1" />
                  )}
                  Rechazar
                </Button>
              </div>
            </div>
          )
        })}

        {sugerencias.length > 5 && (
          <Button variant="outline" className="w-full" size="sm">
            Ver todas las sugerencias ({sugerencias.length})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
