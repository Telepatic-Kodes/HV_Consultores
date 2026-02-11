'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Upload,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  User,
  Clock,
} from 'lucide-react'

interface DocumentoWorkflow {
  id: string
  accion?: string
  etapa?: string
  estado?: string
  notas?: string | null
  comentario?: string | null
  estado_anterior?: string | null
  estado_nuevo?: string | null
  creado_en?: string | null
  created_at?: string | null
  documento_id?: string
  usuario_id?: string | null
}

interface DocumentWorkflowTimelineProps {
  workflow: DocumentoWorkflow[]
}

const actionIcons: Record<string, React.ReactNode> = {
  subido: <Upload className="h-4 w-4" />,
  validado: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  rechazado: <XCircle className="h-4 w-4 text-red-500" />,
  enviado_nubox: <Send className="h-4 w-4 text-purple-500" />,
  aprobado: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error_nubox: <AlertCircle className="h-4 w-4 text-red-500" />,
}

const actionLabels: Record<string, string> = {
  subido: 'Documento Subido',
  validado: 'Documento Validado',
  rechazado: 'Documento Rechazado',
  enviado_nubox: 'Enviado a Nubox',
  aprobado: 'Aprobado',
  error_nubox: 'Error en Nubox',
}

const actionColors: Record<string, string> = {
  subido: 'bg-blue-100 text-blue-900',
  validado: 'bg-green-100 text-green-900',
  rechazado: 'bg-red-100 text-red-900',
  enviado_nubox: 'bg-purple-100 text-purple-900',
  aprobado: 'bg-green-100 text-green-900',
  error_nubox: 'bg-red-100 text-red-900',
}

export function DocumentWorkflowTimeline({ workflow }: DocumentWorkflowTimelineProps) {
  if (!workflow || workflow.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay actividad en este documento
      </div>
    )
  }

  // Sort by date descending (most recent first)
  const sorted = [...workflow].sort((a, b) => {
    const dateA = (a.creado_en || a.created_at) ? new Date((a.creado_en || a.created_at)!).getTime() : 0
    const dateB = (b.creado_en || b.created_at) ? new Date((b.creado_en || b.created_at)!).getTime() : 0
    return dateB - dateA
  })

  return (
    <div className="space-y-4">
      {sorted.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`p-2 rounded-lg ${actionColors[item.accion || item.etapa || ''] || 'bg-gray-100 text-gray-900'}`}>
              {actionIcons[item.accion || item.etapa || ''] || <Clock className="h-4 w-4" />}
            </div>
            {index !== sorted.length - 1 && (
              <div className="w-0.5 h-8 bg-gray-200 my-1" />
            )}
          </div>

          {/* Event content */}
          <div className="flex-1 pt-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm">
                  {actionLabels[item.accion || item.etapa || ''] || item.accion || item.etapa}
                </h4>
                {(item.notas || item.comentario) && (
                  <p className="text-sm text-muted-foreground mt-1">{item.notas || item.comentario}</p>
                )}
                {item.estado_anterior && item.estado_nuevo && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Estado: <span className="text-foreground font-mono">{item.estado_anterior}</span>
                    {' → '}
                    <span className="text-foreground font-mono">{item.estado_nuevo}</span>
                  </p>
                )}
              </div>
              {(item.creado_en || item.created_at) && (
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {format(new Date((item.creado_en || item.created_at)!), 'dd MMM yyyy HH:mm', { locale: es })}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
