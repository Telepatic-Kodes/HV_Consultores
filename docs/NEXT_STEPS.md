# Próximos Pasos - HV Consultores

> Documento de planificación para el avance del proyecto

**Última actualización**: 2026-01-13

---

## Estado Actual

### ✅ Completado
- Dashboard principal con módulos funcionales
- Gestión documental (6 fases completas)
- HV-Chat con OpenAI GPT-4
- HV-Class clasificador IA
- HV-F29 cálculo de formularios
- HV-Bot framework base
- **SII RPA Fases 1-5 COMPLETAS**
  - Dashboard dedicado con 6 tabs
  - RPA Server con Playwright
  - Tareas: Login, Situación, Libros
  - F29 Submit/Download
  - Sistema de scheduling con cron
  - Reintentos con backoff exponencial
  - Monitoreo de servidores RPA
  - Alertas Slack/Email
  - Docker Compose para despliegue
- **BANCOS (Cartolas) Fases 1-6 COMPLETAS**
  - 8 tablas de base de datos con RLS
  - RPA para 4 bancos chilenos
  - Parsers PDF/Excel/CSV/OFX
  - Motor de categorización con reglas
  - Conciliación automática con SII
  - Dashboard con tabs completo
  - Integración en Sidebar

### 🟡 En Progreso
- Testing y QA general

### 🔲 Pendiente
- Integración Nubox completa
- Deploy a producción
- Autenticación en producción
- Implementar RPA para Banco Estado, Santander, BCI (selectores específicos)

---

## Propuesta de Avance

### Opción A: Testing y Calidad (Recomendado)

**Objetivo**: Asegurar estabilidad del sistema antes de producción.

**Tareas:**
1. Ampliar tests unitarios (vitest)
2. Tests de integración para server actions
3. Tests E2E con Playwright
4. Revisión de seguridad (RLS, credenciales)
5. Performance testing
6. Corrección de bugs encontrados
7. Tests específicos para parsers de cartolas

**Estimación**: 1-2 sesiones de desarrollo

---

### Opción B: Preparar para Producción

**Objetivo**: Tener el sistema listo para usuarios reales.

**Tareas:**
1. Activar autenticación Supabase
2. Configurar variables de entorno para producción
3. Setup de Vercel/hosting
4. Migrar base de datos a instancia de producción
5. Configurar dominios y SSL
6. Testing de flujos críticos
7. Documentación de usuario final

**Estimación**: 1-2 sesiones de desarrollo

---

### Opción C: Completar RPA Bancos Restantes

**Objetivo**: Implementar selectores específicos para los 3 bancos pendientes.

**Tareas:**
1. Investigar selectores actuales de Banco Estado
2. Implementar `bancoestado.task.ts`
3. Investigar selectores de Santander
4. Implementar `santander.task.ts`
5. Investigar selectores de BCI
6. Implementar `bci.task.ts`
7. Testing con cuentas de prueba

**Dependencia**: Requiere acceso a portales bancarios para mapear selectores.

**Estimación**: 2-3 sesiones de desarrollo

---

### Opción D: Integración Nubox

**Objetivo**: Completar la integración con Nubox para emisión de DTE.

**Tareas:**
1. Configurar credenciales Nubox en dashboard
2. Implementar emisión de facturas desde documentos
3. Sincronización bidireccional de estados
4. Webhooks para actualizaciones en tiempo real
5. UI para monitoreo de documentos en Nubox

**Dependencia**: Requiere acceso a API Nubox y credenciales.

**Estimación**: 2-3 sesiones de desarrollo

---

## Recomendación

**Con SII RPA y Bancos completados, la secuencia sugerida es:**

```
1. Opción A (Testing)         → Asegurar calidad ⬅️ RECOMENDADO
2. Opción B (Producción)      → Deploy inicial
3. Opción C (RPA Bancos)      → Completar selectores
4. Opción D (Nubox)           → Ampliar integraciones
```

### Justificación:

1. **Testing primero** porque:
   - Sistema muy completo pero sin tests E2E
   - Antes de producción hay que asegurar estabilidad
   - Detectar bugs temprano es más barato

2. **Producción luego** porque:
   - Permite empezar a obtener feedback real
   - Validar supuestos con usuarios
   - El sistema está listo para despliegue

3. **RPA Bancos restantes** porque:
   - Banco de Chile ya funciona como referencia
   - Los otros bancos siguen el mismo patrón
   - Solo falta mapear selectores específicos

4. **Nubox al final** porque:
   - Requiere credenciales de API (posible bloqueo)
   - Es una extensión, no funcionalidad core

---

## Decisión Requerida

Para continuar, seleccionar una opción:

- [ ] **A**: Testing y Calidad
- [ ] **B**: Preparar para Producción
- [ ] **C**: Completar RPA Bancos Restantes
- [ ] **D**: Integración Nubox
- [ ] **Otra**: Especificar

---

## Notas Adicionales

### Configuración Pendiente
- `CREDENTIALS_ENCRYPTION_KEY` - Generar para producción
- `RPA_SERVER_URL` - URL del servidor RPA
- `RPA_SERVER_API_KEY` - API key para RPA server
- Variables Nubox cuando se implemente

### Archivos Clave para Siguiente Fase

**Si se elige Opción A (Testing):**
```
tests/unit/bank-rpa/parsers.test.ts      (crear)
tests/unit/bank-rpa/normalizer.test.ts   (crear)
tests/e2e/bancos/upload.spec.ts          (crear)
tests/e2e/sii/login.spec.ts              (crear)
```

**Si se elige Opción B (Producción):**
```
.env.production                           (configurar)
vercel.json                               (configurar)
src/middleware.ts                         (activar auth)
```

**Si se elige Opción C (RPA Bancos):**
```
rpa-server/src/tasks/banks/bancoestado.task.ts  (crear)
rpa-server/src/tasks/banks/santander.task.ts   (crear)
rpa-server/src/tasks/banks/bci.task.ts         (crear)
```

---

## Resumen de Módulos Completados

| Módulo | Fases | Estado |
|--------|-------|--------|
| Gestión Documental | 6/6 | ✅ |
| SII RPA | 5/5 | ✅ |
| Bancos (Cartolas) | 6/6 | ✅ |
| **Total líneas de código agregadas** | ~5,000+ | - |

---

**Documento actualizado**: 2026-01-13
