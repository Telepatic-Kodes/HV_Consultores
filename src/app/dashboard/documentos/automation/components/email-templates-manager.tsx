'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Loader2,
  Plus,
  Mail,
  Edit,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
} from 'lucide-react'
import {
  obtenerTemplatesEmail,
  crearTemplateEmail,
  actualizarTemplateEmail,
} from '@/app/dashboard/documentos/automation-actions'

interface EmailTemplatesManagerProps {
  clienteId: string
}

const TEMPLATE_TYPES = [
  { value: 'EXPIRATION', label: 'Vencimiento de documentos' },
  { value: 'REPORT', label: 'Envío de reportes' },
  { value: 'APPROVAL', label: 'Solicitud de aprobación' },
  { value: 'NOTIFICATION', label: 'Notificación general' },
  { value: 'CUSTOM', label: 'Personalizado' },
]

const TEMPLATE_VARIABLES = [
  { variable: '{usuario_nombre}', description: 'Nombre del usuario' },
  { variable: '{cliente_nombre}', description: 'Nombre del cliente' },
  { variable: '{documento_tipo}', description: 'Tipo de documento' },
  { variable: '{documento_folio}', description: 'Folio del documento' },
  { variable: '{dias_restantes}', description: 'Días hasta vencimiento' },
  { variable: '{fecha_vencimiento}', description: 'Fecha de vencimiento' },
  { variable: '{fecha_actual}', description: 'Fecha actual' },
  { variable: '{enlace_documento}', description: 'Enlace al documento' },
]

const DEFAULT_TEMPLATES = {
  EXPIRATION: {
    asunto: 'Aviso de Vencimiento - {documento_tipo} {documento_folio}',
    cuerpo: `<p>Estimado/a {usuario_nombre},</p>
<p>Le informamos que el documento <strong>{documento_tipo}</strong> con folio <strong>{documento_folio}</strong> vencerá en <strong>{dias_restantes} días</strong> (fecha: {fecha_vencimiento}).</p>
<p>Por favor, tome las acciones necesarias antes de la fecha de vencimiento.</p>
<p><a href="{enlace_documento}">Ver documento</a></p>
<p>Saludos,<br/>Sistema HV Consultores</p>`,
  },
  APPROVAL: {
    asunto: 'Documento Pendiente de Aprobación - {documento_tipo}',
    cuerpo: `<p>Estimado/a {usuario_nombre},</p>
<p>Tiene un documento pendiente de aprobación:</p>
<ul>
<li>Tipo: {documento_tipo}</li>
<li>Folio: {documento_folio}</li>
<li>Cliente: {cliente_nombre}</li>
</ul>
<p><a href="{enlace_documento}">Revisar y aprobar documento</a></p>
<p>Saludos,<br/>Sistema HV Consultores</p>`,
  },
}

export function EmailTemplatesManager({ clienteId }: EmailTemplatesManagerProps) {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState({ asunto: '', cuerpo: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'EXPIRATION',
    asunto: '',
    cuerpo: '',
    es_default: false,
  })

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await obtenerTemplatesEmail(clienteId)
      setTemplates(data || [])
    } catch (err) {
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [clienteId])

  const handleEdit = (template: any) => {
    setEditingTemplate(template)
    setFormData({
      nombre: template.nombre,
      tipo: template.tipo,
      asunto: template.asunto,
      cuerpo: template.cuerpo,
      es_default: template.es_default,
    })
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormData({
      nombre: '',
      tipo: 'EXPIRATION',
      asunto: '',
      cuerpo: '',
      es_default: false,
    })
    setDialogOpen(true)
  }

  const handleUseDefaultTemplate = () => {
    const defaultTemplate = DEFAULT_TEMPLATES[formData.tipo as keyof typeof DEFAULT_TEMPLATES]
    if (defaultTemplate) {
      setFormData((prev) => ({
        ...prev,
        asunto: defaultTemplate.asunto,
        cuerpo: defaultTemplate.cuerpo,
      }))
    }
  }

  const handlePreview = () => {
    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      '{usuario_nombre}': 'Juan Pérez',
      '{cliente_nombre}': 'Empresa ABC Ltda.',
      '{documento_tipo}': 'Factura',
      '{documento_folio}': 'F-2026-001',
      '{dias_restantes}': '7',
      '{fecha_vencimiento}': '20/01/2026',
      '{fecha_actual}': new Date().toLocaleDateString('es-CL'),
      '{enlace_documento}': '#',
    }

    let asunto = formData.asunto
    let cuerpo = formData.cuerpo

    Object.entries(sampleData).forEach(([variable, value]) => {
      asunto = asunto.replaceAll(variable, value)
      cuerpo = cuerpo.replaceAll(variable, value)
    })

    setPreviewContent({ asunto, cuerpo })
    setPreviewOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)

    try {
      if (editingTemplate) {
        await actualizarTemplateEmail(editingTemplate.id, formData)
      } else {
        await crearTemplateEmail(clienteId, formData)
      }
      setDialogOpen(false)
      loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar template')
    } finally {
      setSaving(false)
    }
  }

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-500" />
          <div>
            <CardTitle>Templates de Email</CardTitle>
            <CardDescription>
              Gestione las plantillas de correo para notificaciones automáticas
            </CardDescription>
          </div>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Template
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay templates de email configurados</p>
            <Button variant="outline" className="mt-4" onClick={handleCreate}>
              Crear primer template
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TEMPLATE_TYPES.find((t) => t.value === template.tipo)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {template.asunto}
                  </TableCell>
                  <TableCell>
                    {template.activo ? (
                      <Badge className="bg-green-500">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                    {template.es_default && (
                      <Badge variant="secondary" className="ml-1">
                        Default
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPreviewContent({
                            asunto: template.asunto,
                            cuerpo: template.cuerpo,
                          })
                          setPreviewOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Dialog para crear/editar template */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Nuevo Template de Email'}
              </DialogTitle>
              <DialogDescription>
                Configure el contenido del email. Use variables para personalizar el mensaje.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre del Template *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      placeholder="Ej: Aviso de vencimiento"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, tipo: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="default"
                      checked={formData.es_default}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, es_default: checked }))
                      }
                    />
                    <Label htmlFor="default">Usar como template predeterminado</Label>
                  </div>
                  {DEFAULT_TEMPLATES[formData.tipo as keyof typeof DEFAULT_TEMPLATES] && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseDefaultTemplate}
                    >
                      Usar template por defecto
                    </Button>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="asunto">Asunto del Email *</Label>
                  <Input
                    id="asunto"
                    value={formData.asunto}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, asunto: e.target.value }))
                    }
                    placeholder="Ej: Aviso de Vencimiento - {documento_tipo}"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cuerpo">Cuerpo del Email (HTML) *</Label>
                  <Textarea
                    id="cuerpo"
                    value={formData.cuerpo}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cuerpo: e.target.value }))
                    }
                    placeholder="<p>Contenido del email...</p>"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="variables" className="mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Use estas variables en el asunto y cuerpo del email. Serán reemplazadas
                    automáticamente con los datos correspondientes.
                  </p>
                  <div className="grid gap-2">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <div
                        key={v.variable}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                      >
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {v.variable}
                          </code>
                          <span className="ml-3 text-sm text-muted-foreground">
                            {v.description}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyVariable(v.variable)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={!formData.asunto || !formData.cuerpo}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTemplate ? 'Guardar Cambios' : 'Crear Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de vista previa */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Vista Previa del Email</DialogTitle>
            </DialogHeader>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b">
                <p className="text-sm">
                  <strong>Asunto:</strong> {previewContent.asunto}
                </p>
              </div>
              <div
                className="p-4 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent.cuerpo }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
