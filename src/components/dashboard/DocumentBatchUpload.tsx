'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, Upload, Loader2, X } from 'lucide-react'
import { cargarDocumento } from '@/app/dashboard/documentos/actions'

interface DocumentBatchUploadProps {
  clienteId: string
  onSuccess?: () => void
}

interface UploadProgress {
  fileName: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export function DocumentBatchUpload({ clienteId, onSuccess }: DocumentBatchUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files) return

    const newUploads: UploadProgress[] = Array.from(files).map((file) => ({
      fileName: file.name,
      status: 'pending',
      progress: 0,
    }))

    setUploads([...uploads, ...newUploads])
    setIsUploading(true)

    // Process files sequentially
    for (const file of Array.from(files)) {
      const fileIndex = newUploads.findIndex((u) => u.fileName === file.name)

      try {
        // Update status to uploading
        setUploads((prev) =>
          prev.map((u, idx) =>
            idx === fileIndex + uploads.length
              ? { ...u, status: 'uploading', progress: 30 }
              : u
          )
        )

        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()

        // Upload
        const resultado = await cargarDocumento(clienteId, 'factura', arrayBuffer, file.name)

        if (resultado.success) {
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === fileIndex + uploads.length
                ? { ...u, status: 'success', progress: 100 }
                : u
            )
          )
        } else {
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === fileIndex + uploads.length
                ? {
                    ...u,
                    status: 'error',
                    error: resultado.error,
                    progress: 0,
                  }
                : u
            )
          )
        }
      } catch (error) {
        setUploads((prev) =>
          prev.map((u, idx) =>
            idx === fileIndex + uploads.length
              ? {
                  ...u,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Error desconocido',
                  progress: 0,
                }
              : u
          )
        )
      }
    }

    setIsUploading(false)
    onSuccess?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setUploads([])
  }

  if (uploads.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
          onChange={(e) => handleFilesSelected(e.target.files)}
          disabled={isUploading}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
          type="button"
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="font-medium">
            {isUploading ? 'Cargando documentos...' : 'Carga múltiples documentos'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">o arrastra los archivos aquí</p>
          <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG, TIFF - Máximo 50MB cada uno</p>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Carga en Lote</h3>
        {uploads.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAll}
            disabled={isUploading}
          >
            Limpiar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {uploads.map((upload, index) => (
          <div key={index} className="space-y-1.5 p-3 border rounded bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {upload.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                )}
                {upload.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
                {upload.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                )}
                {upload.status === 'pending' && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm font-medium truncate">{upload.fileName}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeUpload(index)}
                disabled={isUploading}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {upload.error && (
              <p className="text-xs text-red-600">{upload.error}</p>
            )}

            <Progress value={upload.progress} className="h-1" />
          </div>
        ))}
      </div>

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando {uploads.filter((u) => u.status === 'uploading').length} de{' '}
          {uploads.length} documentos...
        </div>
      )}
    </div>
  )
}
