# Configuración

> Módulo de ajustes de usuario, notificaciones e integraciones del sistema.

## Ubicación

```
src/app/dashboard/configuracion/
├── page.tsx
├── actions.ts
└── configuracion-content.tsx
```

## Descripción

El módulo de Configuración permite a los usuarios gestionar su perfil, preferencias de notificaciones, seguridad y credenciales de integraciones externas.

## Secciones

### 1. Perfil de Usuario
- Nombre completo
- Email (solo lectura)
- Teléfono
- Cargo
- Avatar (futuro)

### 2. Notificaciones
Toggle para cada tipo:
- Documentos pendientes de clasificación
- Errores en bots
- F29 listos para revisión
- Resumen diario por email

### 3. Seguridad
- Cambiar contraseña
- Verificación en dos pasos (futuro)
- Sesiones activas (futuro)

### 4. Integraciones
- Nubox API Key
- OpenAI API Key
- Credenciales SII (por cliente)

## Server Actions

### `getUserProfile()`
Obtiene perfil del usuario autenticado.

```typescript
interface UserProfile {
  id: string
  nombre_completo: string
  telefono: string | null
  cargo: string | null
  avatar_url: string | null
  email?: string  // De auth.user
  rol?: string    // De user_roles
}
```

### `actualizarPerfil(datos)`
Actualiza campos del perfil.

```typescript
actualizarPerfil({
  nombre_completo: "Juan Pérez",
  telefono: "+56 9 1234 5678",
  cargo: "Contador Senior"
})
```

### `getNotificacionesConfig()`
Obtiene preferencias de notificaciones.

```typescript
interface NotificacionConfig {
  documentos_pendientes: boolean
  errores_bots: boolean
  f29_listos: boolean
  resumen_diario: boolean
}
```

### `actualizarNotificaciones(config)`
Guarda preferencias en `configuracion_sistema`.

### `getIntegracionesStatus()`
Verifica qué integraciones están configuradas.

```typescript
interface IntegracionConfig {
  nubox_configured: boolean
  openai_configured: boolean
  sii_configured: boolean
}
```

### `guardarIntegracion(tipo, credencial)`
Guarda credencial encriptada (solo admin).

### `verificarIntegracion(tipo)`
Prueba conexión con servicio externo.

### `cambiarPassword(actual, nuevo)`
Cambia contraseña via Supabase Auth.

## Navegación por Tabs

```
┌─────────────────┬────────────────────────────┐
│ ▪ Perfil        │                            │
│   Notificaciones│    [Contenido del tab      │
│   Seguridad     │     seleccionado]          │
│   API Keys      │                            │
│   Integraciones │                            │
└─────────────────┴────────────────────────────┘
```

## Almacenamiento de Credenciales

Las credenciales se almacenan encriptadas en `configuracion_sistema`:

```typescript
// Encriptación simple (producción usar vault)
const valorEncriptado = Buffer.from(credencial).toString('base64')

await supabase.from('configuracion_sistema').upsert({
  clave: 'nubox_api_key',
  valor: { encrypted: valorEncriptado },
  descripcion: 'Credencial para Nubox',
  updated_by: userId
})
```

## Roles y Permisos

| Acción | Usuario | Admin |
|--------|---------|-------|
| Editar perfil | ✅ | ✅ |
| Cambiar notificaciones | ✅ | ✅ |
| Cambiar contraseña | ✅ | ✅ |
| Ver integraciones | ✅ | ✅ |
| Guardar integraciones | ❌ | ✅ |
| Configuración sistema | ❌ | ✅ |

## Notificaciones Toast

El módulo usa toasts para feedback:

```typescript
setMensaje({
  tipo: 'success',  // o 'error'
  texto: 'Perfil actualizado correctamente'
})

// Se oculta automáticamente después de 3 segundos
setTimeout(() => setMensaje(null), 3000)
```

## Tablas de Base de Datos

- `profiles` - Información de usuarios
- `configuracion_sistema` - Configuraciones globales y por usuario
- `user_roles` - Roles asignados
- `roles` - Definición de roles

## Integraciones Soportadas

### Nubox
- Sincronización de documentos
- Exportación de asientos

### OpenAI
- Respuestas de HV-Chat
- Clasificación avanzada (futuro)

### SII
- Credenciales por cliente
- Ejecución de bots

## Ver también

- [[HV-Chat - Asistente IA]]
- [[HV-Bot - Automatización RPA]]
- [[Esquema de Base de Datos]]
