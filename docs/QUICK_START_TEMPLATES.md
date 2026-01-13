# Document Templates - Quick Start Guide

## 5-Minute Setup

### Step 1: Apply Database Migration

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual SQL in Supabase Dashboard
# Copy content from: src/migrations/add_document_templates.sql
# Paste in SQL Editor and execute
```

### Step 2: Verify Database Objects

Check Supabase Dashboard:
- ✅ Table: `documento_plantillas` exists
- ✅ Functions: `obtener_proximo_folio_plantilla()`, `incrementar_folio_plantilla()` exist
- ✅ Trigger: `trigger_actualizar_timestamp_plantilla` exists
- ✅ RLS Policies: 5 policies enabled on documento_plantillas

## Using Templates

### For End Users

#### Create a Template
```
1. Go to Dashboard → Documentos
2. Click "Plantillas" button (top right)
3. Click "Nueva Plantilla"
4. Fill in:
   - Name: "Facturas 2026"
   - Type: "Factura"
   - Folio Prefix: "FAC-"
   - Default Amount: "1000000"
5. Click "Crear"
```

#### Use a Template
```
1. On Document Upload page
2. Select template from dropdown
3. Values auto-populate:
   - Type: Factura
   - Folio: FAC-1, FAC-2, etc.
   - Amount: $1,000,000
4. Upload document
5. Folio auto-increments next time
```

### For Developers

#### Import and Use Server Actions

```typescript
import {
  obtenerPlantillasCliente,
  crearPlantilla,
  usarPlantilla,
} from '@/app/dashboard/documentos/template-actions'

// Get all templates for a client
const { plantillas } = await obtenerPlantillasCliente(clienteId)

// Create new template
const { plantillaId } = await crearPlantilla(clienteId, {
  nombre: 'Mi Plantilla',
  tipo_documento: 'factura',
  folio_documento_prefijo: 'FAC-',
  monto_total_default: 1000000,
})

// Use template (increments counters)
await usarPlantilla(plantillaId)
```

#### Integrate into Upload Form

```tsx
import { DocumentTemplateSelector } from '@/components/dashboard/DocumentTemplateSelector'

export function DocumentUploadForm({ clienteId }) {
  const [formData, setFormData] = useState({...})

  const handleTemplateSelected = (templateData) => {
    setFormData(prev => ({
      ...prev,
      tipoDocumento: templateData.tipo_documento,
      folioDocumento: templateData.folio_documento,
      fechaDocumento: templateData.fecha_documento,
      montoTotal: templateData.monto_total,
    }))
  }

  return (
    <>
      <DocumentTemplateSelector
        clienteId={clienteId}
        onTemplateSelected={handleTemplateSelected}
      />
      {/* Rest of form */}
    </>
  )
}
```

## Database Schema Quick Reference

### documento_plantillas Table

```sql
CREATE TABLE documento_plantillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core
  cliente_id UUID NOT NULL,
  nombre TEXT NOT NULL UNIQUE (per client),
  descripcion TEXT,
  tipo_documento TEXT NOT NULL,

  -- Defaults
  folio_documento_prefijo TEXT,
  folio_documento_siguiente INTEGER DEFAULT 1,
  fecha_documento_default DATE,
  monto_total_default DECIMAL(12,2),

  -- Status & Usage
  activa BOOLEAN DEFAULT true,
  uso_count INTEGER DEFAULT 0,
  ultima_usada_en TIMESTAMP WITH TIME ZONE,

  -- Audit
  creada_por UUID NOT NULL,
  creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Common Operations

### Get User's Templates
```typescript
const { plantillas } = await obtenerPlantillasCliente(clienteId)

plantillas.forEach(p => {
  console.log(`${p.nombre} (${p.uso_count} usos)`)
})
```

### Update Template
```typescript
await actualizarPlantilla(plantillaId, {
  nombre: 'Nuevo Nombre',
  monto_total_default: 2000000,
  activa: false,
})
```

### Delete Template
```typescript
await eliminarPlantilla(plantillaId)
```

### Duplicate Template
```typescript
const { plantillaId: newId } = await duplicarPlantilla(
  originalPlantillaId,
  'Plantilla Copia'
)
```

## API Reference

### Server Actions

#### obtenerPlantillasCliente(clienteId)
```typescript
Returns: {
  success: boolean
  plantillas?: DocumentoPlantilla[]
  error?: string
}
```

#### crearPlantilla(clienteId, datos)
```typescript
datos = {
  nombre: string,              // Required, unique per client
  descripcion?: string,
  tipo_documento: string,      // Required
  folio_documento_prefijo?: string,
  fecha_documento_default?: string,
  monto_total_default?: number,
}

Returns: {
  success: boolean
  plantillaId?: string
  error?: string
}
```

#### actualizarPlantilla(plantillaId, datos)
```typescript
datos = Partial<{
  nombre: string
  descripcion: string | null
  tipo_documento: string
  folio_documento_prefijo: string | null
  fecha_documento_default: string | null
  monto_total_default: number | null
  activa: boolean
}>

Returns: {
  success: boolean
  error?: string
}
```

#### eliminarPlantilla(plantillaId)
```typescript
Returns: {
  success: boolean
  error?: string
}
```

#### obtenerPlantilla(plantillaId)
```typescript
Returns: {
  success: boolean
  plantilla?: DocumentoPlantilla
  error?: string
}
```

#### usarPlantilla(plantillaId)
```typescript
// Increments usage counter, updates last_used timestamp

Returns: {
  success: boolean
  error?: string
}
```

#### obtenerProximoFolio(plantillaId)
```typescript
Returns: {
  success: boolean
  folio?: string  // e.g., "FAC-5"
  error?: string
}
```

#### duplicarPlantilla(plantillaId, nuevoNombre)
```typescript
Returns: {
  success: boolean
  plantillaId?: string
  error?: string
}
```

## Component Props

### DocumentTemplateSelector

```typescript
interface DocumentTemplateSelectorProps {
  clienteId: string
  onTemplateSelected?: (datos: {
    nombre?: string
    tipo_documento?: string
    folio_documento?: string
    fecha_documento?: string
    monto_total?: number
  }) => void
  disabled?: boolean
}

Usage:
<DocumentTemplateSelector
  clienteId={clienteId}
  onTemplateSelected={handleSelect}
/>
```

## Security

### RLS Policies
- Users see only templates for their assigned clients
- Admin users see all templates
- Only creator can edit/delete
- Automatic client validation

### Best Practices
- Always validate clienteId matches user's assigned clients
- Use server actions (not direct Supabase calls)
- Check permissions before delete/update
- Log template usage for audit

## Testing

### Test Creating a Template
```bash
1. Navigate to Dashboard → Documentos → Plantillas
2. Click "Nueva Plantilla"
3. Fill form with test data
4. Click "Crear"
5. Should see new template in list
```

### Test Using a Template
```bash
1. Go to Document Upload page
2. Select template from dropdown
3. Verify values populate
4. Upload document
5. Check that folio was incremented
```

### Test Template Edit/Delete
```bash
1. Click Edit on template
2. Change values
3. Click Update
4. Verify changes appear
5. Click Delete button
6. Confirm deletion
7. Template should be gone
```

## Troubleshooting

### Template Not Showing Up?
- Check if template is `activa = true`
- Verify user is assigned to client
- Check RLS policy errors in Supabase logs

### Folio Not Incrementing?
- Verify database function exists
- Check server action response
- Look for RPC errors in logs

### Template Not Applying?
- Check browser console for errors
- Verify form data structure matches
- Check loading state

## Performance Tips

- Cache plantillas list in state (not on every render)
- Use useMemo for filtered template lists
- Lazy load template selector only when needed
- Batch template operations when possible

## Examples

### Create Multiple Templates at Startup
```typescript
const templates = [
  { nombre: 'Facturas', tipo_documento: 'factura', folio_documento_prefijo: 'FAC-' },
  { nombre: 'Boletas', tipo_documento: 'boleta', folio_documento_prefijo: 'BOL-' },
  { nombre: 'NC', tipo_documento: 'nota_credito', folio_documento_prefijo: 'NC-' },
]

for (const template of templates) {
  await crearPlantilla(clienteId, template)
}
```

### Find Most Used Template
```typescript
const plantillas = await obtenerPlantillasCliente(clienteId)
const mostUsed = plantillas.reduce((max, p) =>
  p.uso_count > max.uso_count ? p : max
)
console.log(`Most used: ${mostUsed.nombre} (${mostUsed.uso_count} times)`)
```

### Batch Update Template Status
```typescript
const plantillas = await obtenerPlantillasCliente(clienteId)

for (const p of plantillas) {
  if (p.uso_count === 0) {
    // Deactivate unused templates
    await actualizarPlantilla(p.id, { activa: false })
  }
}
```

---

## Next Steps

1. ✅ Apply database migration
2. ✅ Test template creation
3. ✅ Test template selection
4. ✅ Integrate into DocumentUploadForm
5. ✅ Train users on templates
6. Monitor usage patterns
7. Gather feedback for enhancements

---

**Need Help?**
- See: PHASE3_TEMPLATES.md (comprehensive guide)
- See: SYSTEM_OVERVIEW.md (architecture)
- Check: src/app/dashboard/documentos/template-actions.ts (implementation)

