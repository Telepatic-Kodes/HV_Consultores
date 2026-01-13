# Clientes

> Módulo de gestión de clientes del estudio contable con CRUD completo.

## Ubicación

```
src/app/dashboard/clientes/
├── page.tsx
├── actions.ts
└── clientes-content.tsx
```

## Descripción

El módulo de Clientes permite gestionar la cartera de clientes del estudio, incluyendo información tributaria, asignación de contadores y seguimiento de estado.

## Funcionalidades

### 1. Lista de Clientes
- Tabla con todos los clientes activos
- Búsqueda por RUT o razón social
- Ordenamiento por columnas
- Indicadores de estado

### 2. CRUD Completo
- Crear nuevo cliente
- Editar información
- Desactivar cliente (soft delete)
- Modal de formulario

### 3. Estadísticas
- Total clientes activos
- F29 al día
- F29 pendientes
- F29 atrasados

### 4. Información del Cliente
- Razón social y nombre fantasía
- RUT
- Régimen tributario
- Contador asignado
- Dirección completa
- Tasa PPM

## Server Actions

### `getClientes(filtro?)`
Lista clientes con estadísticas calculadas.

```typescript
interface ClienteConStats {
  id: string
  razon_social: string
  rut: string
  regimen_tributario: '14A' | '14D' | '14D_N3' | '14D_N8'
  contador: { id: string; nombre_completo: string } | null
  documentos_pendientes: number
  estado_f29: 'al_dia' | 'pendiente' | 'atrasado'
  ultimo_f29: { periodo: string; status: string } | null
  // ... otros campos
}
```

### `getClienteStats()`
Estadísticas agregadas.

```typescript
interface ClienteStats {
  total: number
  activos: number
  f29AlDia: number
  f29Pendiente: number
  f29Atrasado: number
}
```

### `crearCliente(datos)`
Crea nuevo cliente validando RUT único.

```typescript
// Campos requeridos:
{
  razon_social: string  // Obligatorio
  rut: string           // Obligatorio, único
  regimen_tributario?: string
  contador_asignado_id?: string
  giro?: string
  direccion?: string
  comuna?: string
  region?: string
  nombre_fantasia?: string
  tasa_ppm?: number
}
```

### `actualizarCliente(id, datos)`
Actualiza campos del cliente.

### `desactivarCliente(id)`
Soft delete (activo = false).

### `getContadores()`
Lista usuarios disponibles para asignar.

## Regímenes Tributarios

| Código | Nombre | Descripción |
|--------|--------|-------------|
| 14A | Régimen General | Tributación completa, crédito 65% |
| 14D | Pro Pyme | Hasta 75.000 UF ventas |
| 14D_N3 | Pro Pyme General | PPM reducido 0.25% |
| 14D_N8 | Pro Pyme Transparente | Sin tributación empresa |

## Estado F29

El estado se calcula automáticamente:

```typescript
function calcularEstadoF29(ultimoF29) {
  if (!ultimoF29) return 'pendiente'

  const mesAnterior = new Date(Date.now() - 30*24*60*60*1000)
    .toISOString().slice(0, 7)

  if (ultimoF29.status === 'enviado' || ultimoF29.status === 'aprobado') {
    return ultimoF29.periodo >= mesAnterior ? 'al_dia' : 'atrasado'
  }

  return 'pendiente'
}
```

## Formulario de Cliente

```
┌─────────────────────────────────────────┐
│ Nuevo Cliente                        [X]│
├─────────────────────────────────────────┤
│ Razón Social*: [________________]       │
│ RUT*:          [________________]       │
│ Nombre Fantasía: [______________]       │
│                                         │
│ Régimen:  [14D - Pro Pyme      ▼]       │
│ Contador: [Sin asignar         ▼]       │
│                                         │
│ Giro:     [______________________]      │
│ Dirección: [____________________]       │
│ Comuna:   [________] Región: [______]   │
│ Tasa PPM: [0.25]                        │
│                                         │
│        [Cancelar]  [Crear Cliente]      │
└─────────────────────────────────────────┘
```

## Tablas de Base de Datos

- `clientes` - Información principal
- `profiles` - Contadores (usuarios)
- `documentos` - Documentos por cliente
- `f29_calculos` - F29 por cliente
- `credenciales_portales` - Credenciales SII por cliente

## Ver también

- [[HV-F29 - Formularios Tributarios]]
- [[HV-Bot - Automatización RPA]]
- [[Esquema de Base de Datos]]
