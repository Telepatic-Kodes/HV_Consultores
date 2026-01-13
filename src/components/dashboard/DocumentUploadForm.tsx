'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Upload, CheckCircle, Loader2 } from 'lucide-react'
import { cargarDocumento } from '@/app/dashboard/documentos/actions'

interface DocumentUploadFormProps {
  clienteId: string
  onSuccess?: () => void
}

export function DocumentUploadForm({ clienteId, onSuccess }: DocumentUploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tipoDocumento, setTipoDocumento] = useState('factura')
  const [folio, setFolio] = useState('')
  const [fecha, setFecha] = useState('')
  const [monto, setMonto] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tipos = [
    { value: 'factura', label: 'Factura' },
    { value: 'boleta', label: 'Boleta' },
    { value: 'nota_credito', label: 'Nota de Crédito' },
    { value: 'nota_debito', label: 'Nota de Débito' },
    { value: 'guia_despacho', label: 'Guía de Despacho' },
  ]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Convertir archivo a ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Llamar a la acción del servidor
      const resultado = await cargarDocumento(
        clienteId,
        tipoDocumento,
        arrayBuffer,
        file.name,
        {
          folioDocumento: folio || undefined,
          fechaDocumento: fecha || undefined,
          montoTotal: monto ? parseFloat(monto) : undefined,
        }
      )

      if (resultado.success) {
        setSuccess(`Documento ${file.name} cargado exitosamente`)
        setFolio('')
        setFecha('')
        setMonto('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onSuccess?.()
      } else {
        setError(resultado.error || 'Error al cargar el documento')
      }
    } catch (err) {
      console.error('Error cargando documento:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-card">
      <div className="space-y-2">
        <h3 className="font-semibold">Cargar Nuevo Documento</h3>
        <p className="text-sm text-muted-foreground">
          Carga facturas, boletas o documentos tributarios para procesamiento automático en Nubox
        </p>
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Tipo de Documento</label>
          <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="folio" className="text-sm font-medium mb-1 block">
              Folio (Opcional)
            </label>
            <Input
              id="folio"
              placeholder="Ej: 1000001"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="fecha" className="text-sm font-medium mb-1 block">
              Fecha (Opcional)
            </label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="monto" className="text-sm font-medium mb-1 block">
            Monto Total (Opcional)
          </label>
          <Input
            id="monto"
            type="number"
            placeholder="0.00"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Archivo (PDF, JPG, PNG, TIFF)</label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full"
              type="button"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">
                {loading ? 'Cargando...' : 'Haz clic para seleccionar archivo'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">o arrastra un archivo aquí</p>
              <p className="text-xs text-muted-foreground mt-2">Máximo 50MB</p>
            </button>
          </div>
        </div>

        <Button disabled={loading} type="submit" className="w-full" variant="default">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cargando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Cargar Documento
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
