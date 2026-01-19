# HV-Consultores - Documentación

> Sistema integral de gestión contable y tributaria para estudios de contabilidad en Chile.

## Navegación Rápida

### Arquitectura
- [[Arquitectura General]]
- [[Stack Tecnológico]]
- [[Estructura de Carpetas]]

### Módulos
- [[HV-Class - Clasificador IA]]
- [[HV-F29 - Formularios Tributarios]]
- [[HV-Bot - Automatización RPA]]
- [[SII-RPA - Automatización Portal SII]]
- [[Bancos - Cartolas Bancarias]] ⭐ Nuevo
- [[HV-Chat - Asistente IA]]
- [[Clientes]]
- [[Reportes]]
- [[Configuración]]

### Gestión Documental (Fases 1-6)
- [[DOCUMENT_UPLOAD_GUIDE]] - Carga de documentos
- [[PHASE2_FEATURES]] - Analytics y Exportación
- [[PHASE3_TEMPLATES]] - Plantillas de documentos
- [[PHASE4_INTELLIGENCE]] - Inteligencia y Sugerencias
- [[PHASE5_COMPLIANCE]] - Cumplimiento y Reportes
- [[PHASE6_AUTOMATION]] - Automatización e Integraciones

### Base de Datos
- [[Esquema de Base de Datos]]
- [[Tipos TypeScript]]
- [[Políticas RLS]]

### Desarrollo
- [[Guía de Instalación]]
- [[Server Actions]]
- [[Componentes UI]]

---

## Descripción General

HV-Consultores es una plataforma SaaS diseñada para automatizar y optimizar los procesos de estudios contables chilenos. Integra:

1. **Clasificación automática** de documentos tributarios usando IA
2. **Generación de F29** con validaciones automáticas
3. **Automatización RPA** para portales gubernamentales (SII, Previred)
4. **Gestión de Cartolas Bancarias** con parametrización y conciliación SII
5. **Asistente de chat** especializado en normativa tributaria chilena
6. **Gestión de clientes** con seguimiento de estado tributario
7. **Reportes y métricas** de productividad

## Estado del Proyecto

| Módulo | Estado | Conexión DB | Notas |
|--------|--------|-------------|-------|
| Dashboard | ✅ Completo | ✅ | Stats en tiempo real |
| HV-Class | ✅ Completo | ✅ | Clasificador con ML |
| HV-F29 | ✅ Completo | ✅ | Generación y validación |
| HV-Bot | ✅ Completo | ✅ | RPA para SII/Previred |
| SII RPA | ✅ Completo | ✅ | Fases 1-5 completas |
| **Bancos** | ✅ Completo | ✅ | **Cartolas + Parametrización** |
| HV-Chat | ✅ Completo | ✅ | Integrado con OpenAI GPT-4 |
| Clientes | ✅ Completo | ✅ | CRUD completo |
| Reportes | ✅ Completo | ✅ | Métricas y gráficos |
| Configuración | ✅ Completo | ✅ | Perfil e integraciones |
| Login | ✅ Completo | ✅ | Con modo demo |
| Autenticación | ⏸️ Desactivada | - | Middleware comentado |
| Realtime | ✅ Completo | ✅ | Notificaciones en tiempo real |
| Documentación | ✅ Completo | - | 35+ archivos Obsidian |

### Gestión Documental - Fases

| Fase | Estado | Descripción |
|------|--------|-------------|
| Fase 1 | ✅ Completo | Carga y gestión de documentos |
| Fase 2 | ✅ Completo | Analytics, filtros, exportación |
| Fase 3 | ✅ Completo | Plantillas con auto-folio |
| Fase 4 | ✅ Completo | Inteligencia y sugerencias |
| Fase 5 | ✅ Completo | Cumplimiento y auditoría |
| Fase 6 | ✅ Completo | Automatización e integraciones |

## Integraciones Implementadas

| Integración | Estado | Archivo | Notas |
|-------------|--------|---------|-------|
| OpenAI GPT-4 | ✅ | `src/lib/openai.ts` | Chat con IA tributaria |
| Supabase Realtime | ✅ | `src/hooks/use-realtime.ts` | Notificaciones, bots, docs, F29 |
| Supabase Auth | ⏸️ | `src/middleware.ts` | Desactivado para modo demo |
| Nubox API | ⏳ | - | Pendiente |
| SII RPA | ✅ | `src/lib/sii-rpa/` | Fases 1-5 completas |
| Bank RPA | ✅ | `src/lib/bank-rpa/` | 6 fases completas |

### SII RPA - Estado Detallado

| Fase | Estado | Descripción |
|------|--------|-------------|
| Fase 1: Fundación | ✅ | DB, tipos, encriptación, dashboard |
| Fase 2: Credenciales | ✅ | UI gestión, RPA server setup |
| Fase 3: Tareas Core | ✅ | Login, Situación, Libros |
| Fase 4: F29 | ✅ | Mapeo códigos, envío, descarga, integración |
| Fase 5: Producción | ✅ | Scheduling, reintentos, monitoreo, alertas, Docker |

### Bancos (Cartolas) - Estado Detallado

| Fase | Estado | Descripción |
|------|--------|-------------|
| Fase 1: Fundación | ✅ | DB (8 tablas), tipos, constantes |
| Fase 2: RPA Bancos | ✅ | Task base, Banco de Chile implementado |
| Fase 3: Parsers | ✅ | PDF, Excel, CSV, OFX, normalización |
| Fase 4: Parametrización | ✅ | Motor reglas, conciliación SII |
| Fase 5: Dashboard | ✅ | UI completa con tabs |
| Fase 6: Integraciones | ✅ | Sidebar, exports centralizados |

**Bancos Soportados:** Banco de Chile, Banco Estado, Santander, BCI

## Links Importantes

- **Repositorio**: GitHub (privado)
- **Supabase Dashboard**: [Supabase](https://supabase.com)
- **Vercel**: Para despliegue
