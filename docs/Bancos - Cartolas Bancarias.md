# Bancos - Cartolas Bancarias

> Módulo de gestión de cartolas bancarias con obtención RPA, parametrización automática y conciliación SII.

**Estado**: ✅ Completo (6 fases)
**Última actualización**: 2026-01-13

---

## Descripción General

El módulo de Bancos permite gestionar cartolas bancarias de múltiples instituciones chilenas, con soporte para:
- **Obtención automática** vía RPA (Playwright)
- **Carga manual** como respaldo
- **Parseo inteligente** de múltiples formatos
- **Categorización automática** por reglas y keywords
- **Conciliación** con documentos tributarios del SII

## Bancos Soportados

| Banco | Código | RPA | Parser | Color |
|-------|--------|-----|--------|-------|
| Banco de Chile | `bancochile` | ✅ | ✅ | #004B93 |
| Banco Estado | `bancoestado` | 📋 | ✅ | #00843D |
| Santander | `santander` | 📋 | ✅ | #EC0000 |
| BCI | `bci` | 📋 | ✅ | #003366 |

**Leyenda**: ✅ Implementado | 📋 Selectores pendientes

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                            │
│              /dashboard/bancos - Panel Cartolas                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              API Routes + Server Actions                         │
│    src/app/dashboard/bancos/actions.ts                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
┌───────────────────┐                    ┌───────────────────────┐
│   RPA Server      │                    │   Parser Service      │
│   (Playwright)    │                    │   (PDF/Excel/OFX)     │
│   rpa-server/     │                    │   src/lib/bank-rpa/   │
└───────────────────┘                    └───────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 Supabase (DB + Storage)                          │
│   8 tablas: cuentas, jobs, archivos, transacciones, etc.        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fases de Implementación

### Fase 1: Fundación y Base de Datos ✅

**Archivos creados:**
```
src/lib/bank-rpa/
├── types.ts              # Tipos TypeScript completos
├── constants.ts          # URLs, selectores por banco
└── index.ts              # Exports centralizados

src/migrations/
└── add_bank_cartolas_tables.sql
```

**Tablas de BD:**
- `cartolas_cuentas_bancarias` - Cuentas por cliente
- `cartolas_jobs` - Jobs de descarga/procesamiento
- `cartolas_archivos` - Archivos descargados/subidos
- `cartolas_transacciones` - Transacciones extraídas
- `cartolas_categorias` - Categorías de transacciones
- `cartolas_reglas_categorizacion` - Reglas automáticas
- `cartolas_plan_cuentas_mapping` - Mapeo a plan de cuentas
- `cartolas_estadisticas_mensuales` - Estadísticas agregadas

### Fase 2: RPA para Bancos ✅

**Archivos creados:**
```
rpa-server/src/tasks/banks/
├── bank-base-task.ts     # Task base con anti-detección
├── bancochile.task.ts    # Específico Banco de Chile
└── index.ts              # Factory y exports
```

**Características:**
- Anti-detección reforzada (humanDelay, mouse movements)
- Soporte OTP/Token por banco
- Manejo de sesiones cortas
- Screenshots en cada paso

### Fase 3: Parsers y Normalización ✅

**Archivos creados:**
```
src/lib/bank-rpa/
├── parsers/
│   ├── pdf-parser.ts     # Parser PDF con patrones por banco
│   ├── excel-parser.ts   # Parser Excel/CSV
│   └── index.ts          # Detección automática de formato
└── normalizer.ts         # Normalización y deduplicación
```

**Formatos soportados:**
- PDF (con patrones específicos por banco)
- Excel/XLSX
- CSV (detección automática de delimitador)
- OFX (Open Financial Exchange)

### Fase 4: Sistema de Parametrización ✅

**Archivos creados:**
```
src/lib/bank-rpa/
├── categorization/
│   ├── rules-engine.ts   # Motor de reglas
│   └── index.ts
└── reconciliation/
    ├── sii-matcher.ts    # Conciliación con SII
    └── index.ts
```

**Categorías predefinidas:**
- VEN - Ventas/Ingresos
- COM - Compras/Proveedores
- REM - Sueldos/Remuneraciones
- IMP - Impuestos
- SER - Servicios Básicos
- FIN - Gastos Financieros
- TRF - Transferencias Internas
- OTR - Otros

### Fase 5: Dashboard y UI ✅

**Archivos creados:**
```
src/app/dashboard/bancos/
├── page.tsx              # Dashboard principal con tabs
└── actions.ts            # Server actions completos
```

**Tabs disponibles:**
- Resumen - Vista general
- Cuentas - Gestión de cuentas bancarias
- Transacciones - Explorador de movimientos
- Conciliación - Panel de conciliación SII
- Configuración - Reglas y categorías

### Fase 6: Integraciones ✅

**Archivos modificados:**
- `src/components/dashboard/Sidebar.tsx` - Enlace agregado

---

## Estructura de Base de Datos

### cartolas_cuentas_bancarias
```sql
CREATE TABLE cartolas_cuentas_bancarias (
  id UUID PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  banco bank_code NOT NULL,
  numero_cuenta VARCHAR(50) NOT NULL,
  tipo_cuenta bank_account_type DEFAULT 'corriente',
  moneda bank_currency DEFAULT 'CLP',
  alias VARCHAR(100),
  credencial_id UUID REFERENCES credenciales_portales(id),
  activa BOOLEAN DEFAULT true,
  ultima_descarga TIMESTAMPTZ,
  UNIQUE(cliente_id, banco, numero_cuenta)
);
```

### cartolas_transacciones
```sql
CREATE TABLE cartolas_transacciones (
  id UUID PRIMARY KEY,
  cuenta_id UUID NOT NULL REFERENCES cartolas_cuentas_bancarias(id),
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  descripcion_normalizada TEXT,
  monto DECIMAL(15,2) NOT NULL,
  tipo transaction_type NOT NULL,
  categoria_id UUID REFERENCES cartolas_categorias(id),
  categoria_confianza DECIMAL(3,2),
  conciliado_sii BOOLEAN DEFAULT false,
  estado_conciliacion reconciliation_status DEFAULT 'pending',
  hash_transaccion VARCHAR(64) NOT NULL,
  UNIQUE(cuenta_id, hash_transaccion)
);
```

---

## Flujo de Parametrización

```
1. EXTRACCIÓN
   Cartola (PDF/Excel) → Parser → Transacciones crudas

2. NORMALIZACIÓN
   Transacciones crudas → Normalizer → descripcion_normalizada

3. CATEGORIZACIÓN
   Transacciones normalizadas → Rules Engine → categoria_id + confianza

4. CONCILIACIÓN SII
   Transacciones + Documentos SII → SII Matcher → estado_conciliacion
```

---

## Uso del Módulo

### Agregar Cuenta Bancaria

```typescript
import { createBankAccount } from '@/app/dashboard/bancos/actions'

const result = await createBankAccount({
  cliente_id: 'uuid-cliente',
  banco: 'bancochile',
  numero_cuenta: '1234567890',
  tipo_cuenta: 'corriente',
  alias: 'Cuenta Principal',
})
```

### Subir Cartola Manual

```typescript
import { uploadCartola } from '@/app/dashboard/bancos/actions'

const formData = new FormData()
formData.append('file', file)
formData.append('cuenta_id', cuentaId)
formData.append('mes', '1')
formData.append('año', '2026')

const result = await uploadCartola(formData)
// result.data.transacciones_count = número de transacciones importadas
```

### Categorizar Transacciones

```typescript
import { categorizeTransactions } from '@/app/dashboard/bancos/actions'

const result = await categorizeTransactions(
  ['tx-id-1', 'tx-id-2'],
  clienteId
)
// result.data.categorized = transacciones categorizadas exitosamente
```

---

## Configuración

### Variables de Entorno

```env
# Encriptación de credenciales bancarias
CREDENTIALS_ENCRYPTION_KEY=your-32-byte-hex-key

# RPA Server
RPA_SERVER_URL=http://localhost:3001
RPA_SERVER_API_KEY=your-api-key
```

### Dependencias

```json
{
  "pdf-parse": "^1.1.1",
  "xlsx": "^0.18.5"
}
```

---

## Links Relacionados

- [[SII-RPA - Automatización Portal SII]] - Módulo SII relacionado
- [[PHASE6_AUTOMATION]] - Automatización general
- [[Esquema de Base de Datos]] - Estructura completa de BD
