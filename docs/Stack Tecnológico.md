# Stack Tecnológico

## Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 14.1.0 | Framework React con App Router |
| **React** | 18.x | Biblioteca de UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.4.x | Estilos utility-first |
| **shadcn/ui** | - | Componentes UI accesibles |
| **Lucide React** | - | Iconos |

## Backend

| Tecnología | Uso |
|------------|-----|
| **Next.js Server Actions** | API sin endpoints REST |
| **Supabase** | BaaS (Base de datos + Auth) |
| **PostgreSQL** | Base de datos relacional |

## Supabase Features

- **Database**: PostgreSQL con Row Level Security
- **Auth**: Autenticación de usuarios
- **Storage**: Almacenamiento de archivos
- **Edge Functions**: Funciones serverless (futuro)
- **Realtime**: Subscripciones en tiempo real (futuro)

## Dependencias Principales

```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "tailwindcss": "^3.4.x",
    "lucide-react": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

## Configuración TypeScript

```typescript
// tsconfig.json highlights
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Herramientas de Desarrollo

| Herramienta | Uso |
|-------------|-----|
| **ESLint** | Linting de código |
| **Prettier** | Formateo de código |
| **VS Code** | Editor recomendado |
| **pnpm/npm** | Package manager |

## Ver también

- [[Arquitectura General]]
- [[Guía de Instalación]]
