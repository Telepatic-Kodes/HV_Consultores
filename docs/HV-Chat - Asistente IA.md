# HV-Chat - Asistente IA

> Asistente conversacional especializado en normativa tributaria y contable chilena.

## Ubicación

```
src/app/dashboard/chat/
├── page.tsx
├── actions.ts
└── chat-content.tsx
```

## Descripción

HV-Chat es un asistente de inteligencia artificial entrenado en normativa del SII, procedimientos tributarios y contabilidad chilena. Responde consultas de usuarios con información precisa y fuentes.

## Funcionalidades

### 1. Interfaz de Chat
- Conversación en tiempo real
- Historial de mensajes
- Indicador de escritura
- Scroll automático

### 2. Gestión de Sesiones
- Múltiples conversaciones
- Sidebar con historial
- Crear nueva sesión
- Eliminar sesiones

### 3. Sistema de Respuestas
- Respuestas estructuradas
- Fuentes citadas
- Formateo markdown
- Temas especializados

### 4. Feedback
- Thumbs up/down por mensaje
- Mejora continua del modelo

## Server Actions

### `getSesiones()`
Lista sesiones del usuario ordenadas por fecha.

```typescript
interface SesionConMensajes {
  id: string
  titulo: string
  activa: boolean
  created_at: string
  updated_at: string
  mensajes: ChatMensaje[]
}
```

### `getOrCreateSesion(sesionId?)`
Obtiene sesión existente o crea una nueva con mensaje de bienvenida.

### `enviarMensaje(sesionId, contenido)`
Procesa mensaje del usuario y genera respuesta.

```typescript
// Flujo:
1. Guardar mensaje del usuario
2. Buscar en base de conocimiento
3. Generar respuesta (actualmente predefinida)
4. Guardar respuesta con fuentes
5. Actualizar título de sesión si es nuevo
```

### `darFeedback(mensajeId, rating)`
Registra feedback del usuario (1-5 estrellas).

### `eliminarSesion(sesionId)`
Desactiva sesión (soft delete).

## Temas Soportados

| Tema | Palabras Clave |
|------|----------------|
| Formulario 29 | f29, formulario 29, declaración mensual |
| PPM | ppm, pago provisional, anticipos |
| Régimen Tributario | 14d, 14a, régimen, pyme, transparente |
| IVA | iva, impuesto, débito, crédito |
| General | (cualquier otro) |

## Respuestas Predefinidas

El sistema incluye respuestas predefinidas para temas comunes:

```typescript
// Ejemplo F29
{
  texto: `El Formulario 29 es la declaración mensual de IVA...
    **Débito Fiscal (Código 89):** IVA de tus ventas
    **Crédito Fiscal (Código 538):** IVA de tus compras
    ...`,
  fuentes: [
    { titulo: 'Circular SII N° 42', contenido: 'Instrucciones sobre F29' }
  ]
}
```

## Mensaje de Bienvenida

```
¡Hola! Soy HV-Chat, tu asistente de inteligencia artificial
para consultas contables y tributarias chilenas. Puedo ayudarte con:

• Normativa del SII
• Formularios F29 y F22
• Régimen tributario (14A, 14D)
• IVA, PPM y retenciones
• Plazos y procedimientos

¿En qué puedo ayudarte hoy?
```

## Tablas de Base de Datos

- `chat_sesiones` - Conversaciones por usuario
- `chat_mensajes` - Mensajes con fuentes
- `chat_feedback` - Ratings de usuarios
- `documentos_conocimiento` - Base de conocimiento

## Integración Futura

- OpenAI GPT-4 para respuestas dinámicas
- Embeddings para búsqueda semántica
- RAG (Retrieval Augmented Generation)
- Fine-tuning con normativa chilena

## Ver también

- [[Configuración]]
- [[Esquema de Base de Datos]]
