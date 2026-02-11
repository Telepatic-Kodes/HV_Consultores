'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, Table2, Code2, FileJson } from 'lucide-react'
import {
  downloadCSV,
  documentosToExcel,
  documentosToJSON,
  downloadSummaryReport,
  documentosToCSV,
} from '@/lib/export-documents'

interface DocumentoCarga {
  id: string
  cliente_id: string
  nombre_archivo: string
  tipo_documento: string
  folio_documento: string | null
  fecha_documento: string | null
  monto_total: number | null
  estado: string
  nubox_documento_id: string | null
  nubox_estado: string | null
  cargado_por: string
  cargado_en: string | null
  validado_en: string | null
  enviado_en: string | null
}

interface DocumentExportMenuProps {
  documentos: DocumentoCarga[]
  disabled?: boolean
}

export function DocumentExportMenu({ documentos, disabled = false }: DocumentExportMenuProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExportCSV = async () => {
    setExporting('csv')
    try {
      const csv = documentosToCSV(documentos)
      downloadCSV(csv)
    } finally {
      setExporting(null)
    }
  }

  const handleExportExcel = async () => {
    setExporting('excel')
    try {
      await documentosToExcel(documentos)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Error al exportar a Excel. Asegúrate de tener la librería XLSX instalada.')
    } finally {
      setExporting(null)
    }
  }

  const handleExportJSON = async () => {
    setExporting('json')
    try {
      documentosToJSON(documentos)
    } finally {
      setExporting(null)
    }
  }

  const handleExportReport = async () => {
    setExporting('report')
    try {
      downloadSummaryReport(documentos)
    } finally {
      setExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || documentos.length === 0} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Formato de Exportación</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleExportCSV} disabled={exporting !== null}>
          <Table2 className="h-4 w-4 mr-2" />
          <span>CSV</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportExcel} disabled={exporting !== null}>
          <Table2 className="h-4 w-4 mr-2" />
          <span>Excel (XLSX)</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportJSON} disabled={exporting !== null}>
          <Code2 className="h-4 w-4 mr-2" />
          <span>JSON</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleExportReport} disabled={exporting !== null}>
          <FileText className="h-4 w-4 mr-2" />
          <span>Resumen (TXT)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
