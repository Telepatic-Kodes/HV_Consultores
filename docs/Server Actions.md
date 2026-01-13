# Server Actions

> Documentación de todas las Server Actions disponibles en el proyecto.

## ¿Qué son Server Actions?

Server Actions son funciones async que se ejecutan en el servidor y pueden ser llamadas directamente desde componentes React. Reemplazan la necesidad de crear endpoints API.

```typescript
'use server'

export async function miAction(datos) {
  // Se ejecuta en el servidor
  // Puede acceder a la base de datos directamente
}
```

## Patrón Común

```typescript
'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function crearAlgo(datos: DatosInput): Promise<Resultado> {
  const supabase = createClient()

  // 1. Validar usuario (opcional)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  // 2. Ejecutar operación
  const { data, error } = await supabase
    .from('tabla')
    .insert(datos)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 3. Revalidar cache
  revalidatePath('/ruta/afectada')

  // 4. Retornar resultado
  return { success: true, data }
}
```

## Actions por Módulo

### Clasificador (`clasificador/actions.ts`)

| Action | Descripción | Parámetros |
|--------|-------------|------------|
| `getDocumentosPendientes` | Lista documentos sin clasificar | `clienteId?` |
| `getClasificadorStats` | Estadísticas del clasificador | - |
| `getCuentasContables` | Plan de cuentas del cliente | `clienteId` |
| `confirmarClasificacion` | Confirma clasificación ML | `documentoId, cuentaId` |
| `reclasificarDocumento` | Cambia cuenta asignada | `documentoId, cuentaId` |
| `aprobarLoteAltaConfianza` | Aprueba docs >90% confianza | - |

### F29 (`f29/actions.ts`)

| Action | Descripción | Parámetros |
|--------|-------------|------------|
| `getF29List` | Lista F29 con filtros | `filtros?` |
| `getF29Stats` | Estadísticas de F29 | - |
| `getClientesParaF29` | Clientes disponibles | - |
| `generarF29` | Genera F29 desde documentos | `clienteId, periodo` |
| `ejecutarValidaciones` | Ejecuta 5 validaciones | `f29Id` |
| `aprobarF29` | Aprueba F29 validado | `f29Id` |

### Bots (`bots/actions.ts`)

| Action | Descripción | Parámetros |
|--------|-------------|------------|
| `getBots` | Lista bots con stats | - |
| `getBotStats` | Estadísticas globales | - |
| `getJobsRecientes` | Últimos jobs ejecutados | `limite` |
| `getClientesParaBot` | Clientes para ejecutar | - |
| `ejecutarBot` | Inicia ejecución de bot | `botId, clienteId?` |
| `cancelarJob` | Cancela job en ejecución | `jobId` |

### Chat (`chat/actions.ts`)

| Action | Descripción | Parámetros |
|--------|-------------|------------|
| `getSesiones` | Lista sesiones del usuario | - |
| `getOrCreateSesion` | Obtiene o crea sesión | `sesionId?` |
| `enviarMensaje` | Envía mensaje y genera respuesta | `sesionId, contenido` |
| `darFeedback` | Registra feedback | `mensajeId, rating` |
| `eliminarSesion` | Desactiva sesión | `sesionId` |

### Clientes (`clientes/actions.ts`)

| Action | Descripción | Parámetros |
|--------|-------------|------------|
| `getClientes` | Lista clientes con stats | `filtro?` |
| `getClienteStats` | Estadísticas de clientes | - |
| `getClienteById` | Obtiene cliente por ID | `id` |
| `getContadores` | Lista contadores disponibles | - |
| `crearCliente` | Crea nuevo cliente | `datos` |
| `actualizarCliente` | Actualiza cliente | `id, datos` |
| `desactivarCliente` | Soft delete | `id` |

### Reportes (`reportes/actions.ts`)

| Action | Descripción | Parámetros |
|--------|-------------|------------|
| `getMetricasGenerales` | Métricas del mes | - |
| `getDatosEvolucion` | Datos para gráfico | `meses` |
| `getReportesDisponibles` | Lista de reportes | - |
| `generarReporte` | Genera reporte específico | `reporteId` |
| `getProductividadContadores` | Productividad por usuario | - |

### Configuración (`configuracion/actions.ts`)

| Action | Descripción | Parámetros |
|--------|-------------|------------|
| `getUserProfile` | Perfil del usuario actual | - |
| `actualizarPerfil` | Actualiza perfil | `datos` |
| `getNotificacionesConfig` | Config de notificaciones | - |
| `actualizarNotificaciones` | Guarda notificaciones | `config` |
| `getIntegracionesStatus` | Estado de integraciones | - |
| `guardarIntegracion` | Guarda credencial | `tipo, credencial` |
| `verificarIntegracion` | Verifica conexión | `tipo` |
| `cambiarPassword` | Cambia contraseña | `actual, nuevo` |

## Uso en Componentes Cliente

```typescript
'use client'

import { useTransition } from 'react'
import { crearCliente } from './actions'

function MiComponente() {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (datos) => {
    startTransition(async () => {
      const result = await crearCliente(datos)
      if (result.success) {
        // Éxito
      } else {
        // Error: result.error
      }
    })
  }

  return (
    <button onClick={handleSubmit} disabled={isPending}>
      {isPending ? 'Guardando...' : 'Guardar'}
    </button>
  )
}
```

## Tipos de Retorno

```typescript
// Operación simple
type ResultadoSimple = { success: boolean }

// Con error
type ResultadoConError = {
  success: boolean
  error?: string
}

// Con datos
type ResultadoConDatos<T> = {
  success: boolean
  data?: T
  error?: string
}
```

## Ver también

- [[Arquitectura General]]
- [[Estructura de Carpetas]]
