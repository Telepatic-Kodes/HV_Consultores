# Arquitectura General

## Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Next.js   │  │  React 18   │  │ Tailwind +  │             │
│  │   App Router│  │  Components │  │  shadcn/ui  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER ACTIONS                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Mutations  │  │   Queries   │  │ Revalidation│             │
│  │  (create,   │  │  (fetch,    │  │   (cache    │             │
│  │   update)   │  │   list)     │  │   invalidate)│            │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │             │
│  │  + RLS      │  │  (Usuarios) │  │  (Archivos) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Patrón de Componentes

### Server Components (por defecto)
- Páginas (`page.tsx`)
- Layouts
- Fetching de datos inicial

### Client Components (`'use client'`)
- Interactividad (clicks, formularios)
- Estado local (`useState`, `useTransition`)
- Efectos (`useEffect`)

### Flujo de Datos

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   page.tsx   │────▶│   actions.ts │────▶│   Supabase   │
│   (Server)   │     │   (Server)   │     │   (Database) │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       ▼                    │
┌──────────────┐            │
│  *-content   │◀───────────┘
│   .tsx       │   (revalidatePath)
│  (Client)    │
└──────────────┘
```

## Estructura por Módulo

Cada módulo sigue el patrón:

```
src/app/dashboard/[modulo]/
├── page.tsx           # Server Component - fetch inicial
├── actions.ts         # Server Actions - CRUD operations
├── [modulo]-content.tsx  # Client Component - UI interactiva
└── (componentes/)     # Componentes específicos del módulo
```

## Comunicación entre Componentes

1. **Props**: Datos de Server → Client Component
2. **Server Actions**: Client → Server (mutaciones)
3. **useTransition**: Loading states en cliente
4. **revalidatePath**: Refrescar datos después de mutación

## Arquitectura SII RPA

El sistema SII RPA utiliza una arquitectura híbrida con servidor dedicado:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dashboard SII (/dashboard/sii)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Selector   │  │  Historial  │  │ Credenciales│             │
│  │  de Tareas  │  │  de Jobs    │  │   Manager   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Routes SII RPA                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  /execute   │  │  /webhook   │  │   /status   │             │
│  │  (iniciar)  │  │  (updates)  │  │  (consultar)│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RPA Server (Playwright)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Browser    │  │    Task     │  │    Anti-    │             │
│  │   Pool      │  │  Executor   │  │  Detection  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Portal SII                                  │
│     Login | F29 | Libros | Situación | Certificados             │
└─────────────────────────────────────────────────────────────────┘
```

## Ver también

- [[Stack Tecnológico]]
- [[Estructura de Carpetas]]
- [[Server Actions]]
- [[SII-RPA - Automatización Portal SII]]
