# Tipos TypeScript

> Documentación de los tipos generados y personalizados del proyecto.

## Ubicación

```
src/types/database.types.ts
```

## Tipos Generados por Supabase

Los tipos se generan automáticamente desde el esquema de la base de datos.

### Comando de Generación

```bash
npx supabase gen types typescript \
  --project-id <project-id> \
  --schema public \
  > src/types/database.types.ts
```

## Estructura Principal

```typescript
export type Database = {
  public: {
    Tables: {
      clientes: { Row: {...}, Insert: {...}, Update: {...} }
      documentos: { Row: {...}, Insert: {...}, Update: {...} }
      // ... más tablas
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
```

## Helpers de Tipos

```typescript
// Obtener tipo de fila
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

// Obtener tipo de inserción
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

// Obtener tipo de actualización
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Obtener enum
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
```

## Aliases de Conveniencia

```typescript
export type Profile = Tables<'profiles'>
export type Cliente = Tables<'clientes'>
export type Documento = Tables<'documentos'>
export type F29Calculo = Tables<'f29_calculos'>
export type F29Codigo = Tables<'f29_codigos'>
export type BotJob = Tables<'bot_jobs'>
export type ChatSesion = Tables<'chat_sesiones'>
export type ChatMensaje = Tables<'chat_mensajes'>
export type Notificacion = Tables<'notificaciones'>
export type AuditLog = Tables<'audit_logs'>
```

## Enums Disponibles

```typescript
type DocumentoStatus =
  | 'pendiente'
  | 'clasificado'
  | 'revisado'
  | 'aprobado'
  | 'exportado'

type F29Status =
  | 'borrador'
  | 'calculado'
  | 'validado'
  | 'aprobado'
  | 'enviado'

type BotJobStatus =
  | 'pendiente'
  | 'ejecutando'
  | 'completado'
  | 'fallido'
  | 'cancelado'

type RegimenTributario =
  | '14A'
  | '14D'
  | '14D_N3'
  | '14D_N8'

type ValidacionResultado =
  | 'ok'
  | 'warning'
  | 'error'

type UserRoleType =
  | 'admin'
  | 'jefe_contabilidad'
  | 'contador'
  | 'coordinador_gp'
  | 'asistente'
```

## Tipos Personalizados (en actions.ts)

### Clasificador

```typescript
interface DocumentoConPrediccion extends Documento {
  cliente: { razon_social: string } | null
  predicciones: ClasificacionML[]
}

interface ClasificadorStats {
  pendientes: number
  clasificadosHoy: number
  precisionML: number
  altaConfianza: number
}
```

### F29

```typescript
interface F29ConCliente extends F29Calculo {
  cliente: { razon_social: string; rut: string } | null
  validaciones: F29Validacion[]
}

interface F29Stats {
  pendientes: number
  aprobados: number
  enviados: number
  montoTotal: number
}
```

### Clientes

```typescript
interface ClienteConStats extends Cliente {
  contador: Profile | null
  documentos_pendientes: number
  estado_f29: 'al_dia' | 'pendiente' | 'atrasado'
  ultimo_f29: { periodo: string; status: string } | null
}

interface ClienteStats {
  total: number
  activos: number
  f29AlDia: number
  f29Pendiente: number
  f29Atrasado: number
}
```

### Chat

```typescript
interface SesionConMensajes extends ChatSesion {
  mensajes: ChatMensaje[]
  ultimo_mensaje?: string
}

interface MensajeConFuentes extends ChatMensaje {
  fuentes_parsed: { titulo: string; contenido: string }[]
}
```

### Bots

```typescript
interface BotConStats extends BotDefinicion {
  ultimo_job: BotJob | null
  exitos_hoy: number
  fallos_hoy: number
}

interface BotJobConDetalles extends BotJob {
  bot: { nombre: string } | null
  cliente: { razon_social: string } | null
}
```

## Tipos de Reportes Ejecutivos

Ubicacion: `src/types/reportes-ejecutivo.types.ts`

### ExecutiveDashboardData

```typescript
interface ExecutiveDashboardData {
  periodo: string
  kpis: ExecutiveKPI[]
  waterfall: WaterfallDataPoint[]
  categoryBreakdown: CategoryBreakdown[]
  evolution: TimeSeriesPoint[]
  insights: Insight[]
  recommendations?: Recommendation[]
}
```

### ExecutiveKPI

```typescript
interface ExecutiveKPI {
  id: string
  label: string
  value: number
  previousValue?: number
  change?: number
  changePercent?: number
  target?: number
  targetPercent?: number
  sparklineData?: number[]
  format: 'currency' | 'number' | 'percent'
  trend: 'up' | 'down' | 'neutral'
  status: 'success' | 'warning' | 'danger' | 'neutral'
}
```

### WaterfallDataPoint

```typescript
interface WaterfallDataPoint {
  label: string
  value: number
  type: 'start' | 'end' | 'positive' | 'negative'
  color?: string
}
```

### Insight

```typescript
interface Insight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'alert'
  category: 'trend' | 'anomaly' | 'comparison' | 'recommendation' | 'milestone'
  title: string
  description: string
  metric?: { value: number; change: number; unit: string }
  priority: 1 | 2 | 3
  icon?: string
}
```

### TimeSeriesPoint

```typescript
interface TimeSeriesPoint {
  date: string
  value: number
  previousValue?: number
  label?: string
}
```

### CategoryBreakdown

```typescript
interface CategoryBreakdown {
  category: string
  value: number
  count: number
  percentage: number
  color?: string
}
```

### InformeEjecutivoData (para PDF)

```typescript
interface InformeEjecutivoData {
  cliente?: {
    rut: string
    razon_social: string
  }
  periodo: string
  kpis: ExecutiveKPI[]
  waterfall: WaterfallDataPoint[]
  insights: Insight[]
  generadoEn: string
}
```

### Slide (para Presentacion)

```typescript
interface Slide {
  id: string
  type: 'title' | 'kpi' | 'chart' | 'comparison' | 'insight' | 'summary'
  title?: string
  subtitle?: string
  content: React.ReactNode
}
```

---

## Uso con Supabase Client

```typescript
import { createClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database.types'

// El cliente está tipado automáticamente
const supabase = createClient()

// Las queries tienen autocompletado
const { data } = await supabase
  .from('clientes')  // ✓ Tabla válida
  .select('razon_social, rut')  // ✓ Columnas válidas
  .eq('activo', true)  // ✓ Tipo correcto (boolean)
```

## Ver tambien

- [[Esquema de Base de Datos]]
- [[Server Actions]]
- [[Reportes]]
- [[Componentes UI]]
