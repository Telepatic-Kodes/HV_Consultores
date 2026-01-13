# Guía de Instalación

> Instrucciones para configurar el entorno de desarrollo de HV-Consultores.

## Requisitos Previos

- **Node.js** 18.x o superior
- **npm** o **pnpm**
- **Git**
- Cuenta en **Supabase**

## 1. Clonar Repositorio

```bash
git clone <url-repositorio>
cd HV-CONSULTORES
```

## 2. Instalar Dependencias

```bash
npm install
# o
pnpm install
```

## 3. Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opcional - para producción
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtener credenciales de Supabase

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar proyecto
3. Settings → API
4. Copiar `Project URL` y `anon public` key

## 4. Configurar Base de Datos

### Opción A: Usar proyecto existente
Las tablas ya están creadas en el proyecto de Supabase.

### Opción B: Crear tablas (nuevo proyecto)
Ejecutar las migraciones SQL en Supabase SQL Editor.

## 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Abrir http://localhost:3000

## 6. Verificar Funcionamiento

1. Navegar a `/dashboard`
2. Verificar que los módulos cargan datos
3. Probar crear un cliente en `/dashboard/clientes`

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Ejecutar ESLint |

## Estructura de Puertos

- **3000**: Puerto principal
- **3001-3004**: Puertos alternativos si 3000 está ocupado

## Solución de Problemas

### Error: Module not found
```bash
# Reiniciar servidor de desarrollo
Ctrl+C
npm run dev
```

### Error: Puerto en uso
```bash
# En Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# En Mac/Linux
lsof -i :3000
kill -9 <pid>
```

### Error de RLS Policy
Si ves errores de Row Level Security:
1. Ir a Supabase Dashboard
2. Authentication → Policies
3. Verificar políticas de la tabla afectada

### Error de tipos TypeScript
```bash
# Regenerar tipos desde Supabase
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
```

## Desarrollo con Autenticación Desactivada

Actualmente la autenticación está desactivada en `middleware.ts`:

```typescript
// TODO: Reactivar autenticación
// if (request.nextUrl.pathname.startsWith('/dashboard')) {
//   if (!session) {
//     return NextResponse.redirect(new URL('/login', request.url))
//   }
// }
```

Para reactivar, descomentar estas líneas.

## Despliegue

### Vercel (Recomendado)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

### Manual

```bash
npm run build
npm run start
```

## Ver también

- [[Stack Tecnológico]]
- [[Estructura de Carpetas]]
- [[Arquitectura General]]
