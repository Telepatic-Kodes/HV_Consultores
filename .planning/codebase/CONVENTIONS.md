# Coding Conventions

**Analysis Date:** 2026-02-09

## Naming Patterns

**Files:**
- PascalCase for React components: `Button.tsx`, `Dialog.tsx` (UI components in `src/components/ui/`)
- kebab-case for utility/service modules: `bank-rpa.ts`, `external-services.ts`, `alert-rule-engine.ts`
- kebab-case for task files: `login.task.ts`, `f29-download.task.ts`, `banco-chile.task.ts`
- File suffixes indicate purpose: `.test.ts` (tests), `.task.ts` (RPA tasks), `.service.ts` (services)

**Functions:**
- camelCase for all functions
- Verb-based naming for functions that perform actions: `parseCSV()`, `categorize()`, `validateEmail()`, `createRulesEngine()`
- Factory functions prefixed with `create`: `createMockTransaction()`, `createExcelParser()`, `createSlackBlocks()`
- Helper functions prefixed with descriptive verb: `parseDate()`, `parseAmount()`, `detectDelimiter()`, `findColumnMatch()`
- Spanish naming in domain-specific logic: `enviarEmail()`, `enviarPorSMTP()`, `enviarPorSendgrid()`, `enviarSlack()`

**Variables:**
- camelCase for all variables
- Descriptive names reflecting purpose: `batchJob`, `transacciones`, `totalRules`, `clientRules`
- Prefix with type for clarity: `tx` (transaction), `rule`, `engine`, `parser`
- Enum/constant-like values: `ABBREVIATION_EXPANSIONS`, `COLUMN_ALIASES`, `IGNORE_PATTERNS`, `DEFAULT_CATEGORIES`

**Types:**
- PascalCase for all types and interfaces
- Descriptive names: `BankTransaction`, `CategorizationRule`, `TransactionCategory`, `RuleMatchResult`
- Input/output types: `CreateBankAccountInput`, `UpdateTransactionInput`, `EmailMessage`, `EmailConfig`
- Result types: `ParsedCartola`, `ReconciliationSummary`, `BankDownloadResult`
- Generic response wrapper: `PaginatedResponse<T>`

## Code Style

**Formatting:**
- No explicit linter config found (next lint defaults to ESLint config-next)
- 2-space indentation observed in all files
- Line length not enforced, but most lines stay under 100 characters
- Import grouping: Standard library → Third-party → Local imports
- Trailing commas in objects/arrays

**Linting:**
- ESLint with Next.js config applied via `next lint` command
- No custom `.eslintrc` in project root (uses Next.js defaults via `eslint-config-next`)
- Strict TypeScript enabled: `strict: true` in `tsconfig.json` for frontend and RPA server

## Import Organization

**Order:**
1. Standard library imports (`path`, `crypto`)
2. Third-party framework imports (`express`, `winston`, `playwright`, `react`)
3. Third-party utility imports (radix-ui, class-variance-authority, type imports)
4. Local absolute imports (using `@/` alias)
5. Type-only imports at end (marked with `type` keyword)

**Path Aliases:**
- `@/*` → `./src/*` for frontend
- `@/*` → `./src/*` for RPA server

**Examples from codebase:**
```typescript
// From rules-engine.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  CategorizationRulesEngine,
  createRulesEngine,
  createRuleFromTransaction,
  suggestRules,
} from '@/lib/bank-rpa/categorization/rules-engine'
import type {
  BankTransaction,
  CategorizationRule,
  TransactionCategory,
} from '@/lib/bank-rpa/types'
```

```typescript
// From auth.ts (RPA server)
import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
```

```typescript
// From button.tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
```

## Error Handling

**Patterns:**
- Direct error throwing for configuration/setup issues: `throw new Error('API_KEY not configured')`
- Try-catch blocks for async operations
- Logging before returning error responses
- Consistent error response format: `{ success: false, error: string }`

**Examples:**
```typescript
// From auth.ts - Direct config validation
if (!expectedApiKey) {
  logger.error('API_KEY not configured - rejecting request')
  res.status(500).json({
    success: false,
    error: 'Server misconfiguration: API key not set',
  })
  return
}

// From external-services.ts - Invalid provider handling
default:
  throw new Error(`Unknown email provider: ${config.provider}`)
```

- Returning `null` for optional results that don't match criteria: `expect(result).toBeNull()`
- Graceful degradation: Test files show validation patterns that return `undefined` for invalid input

## Logging

**Framework:** Winston (in RPA server at `src/utils/logger.ts`)

**Patterns:**
- Logger configuration exported as singleton: `export const logger = winston.createLogger(...)`
- Log levels: `error`, `warn`, `info` (default)
- Format: `${timestamp} [${level}]: ${message} ${metadata}`
- Environment-driven configuration: `LOG_LEVEL` env var
- Metadata objects passed as second parameter: `logger.warn('Invalid API key attempt', { ip, path })`
- File transports in production only
- Console output with colorization

**Usage:**
```typescript
// From auth.ts
logger.error('API_KEY not configured - rejecting request')
logger.warn('Invalid API key attempt', {
  ip: req.ip,
  path: req.path,
})
```

## Comments

**When to Comment:**
- Section headers with heavy dividers: `// =============================================================================`
- Purpose statements at file top: `// HV Consultores - SII RPA Server`
- Complex business logic explanations
- Non-obvious regex patterns: Line 481 in parsers.test.ts documents Banco de Chile patterns
- Integration notes and TODOs for unimplemented features

**JSDoc/TSDoc:**
- Minimal usage observed
- Only on public exported functions in external-services.ts:
  ```typescript
  /**
   * Send email using configured provider
   */
  export async function enviarEmail(...)
  ```
- No param/return documentation observed in codebase
- Type annotations used instead of JSDoc types

**TODO/FIXME Pattern:**
- Comments mark incomplete integrations: `// TODO: Integrate with actual email service`
- Indicate mock vs. real implementations: `// TODO: Implement error trend`
- Mark performance improvements needed: `// TODO: Implement Redis caching`
- Found in 14 locations across analytics, SII RPA, queue, and API routes

## Function Design

**Size:** Functions typically 20-100 lines; large functions in parsers/normalizers can reach 150+ lines for multi-step data processing

**Parameters:**
- Prefer interfaces/types over multiple params: `parseCSV(csv: string)` vs. separate string params
- Factory functions often take options object: `createRulesEngine(options: EngineOptions)`
- Consistent param naming: `overrides`, `config`, `mensaje`

**Return Values:**
- Sync functions return direct values or objects: `{ messageId: string; timestamp: Date }`
- Async functions return Promises of same types: `Promise<{ messageId: string; timestamp: Date }>`
- Query results return Maps for batch operations: `engine.categorizeMany() → Map<string, RuleMatchResult>`
- Statistics/summary data returned as objects with clear field names

**Examples:**
```typescript
// Factory with options
export function createRulesEngine(options?: Partial<EngineOptions>): CategorizationRulesEngine

// Async with typed return
export async function enviarEmail(
  config: EmailConfig,
  mensaje: EmailMessage
): Promise<{ messageId: string; timestamp: Date }>

// Batch operation returning Map
categorizeMany(transactions: BankTransaction[]): Map<string, RuleMatchResult | null>

// Statistics returning object
getStats(): EngineStats
```

## Module Design

**Exports:**
- Named exports for functions and types: `export function categorize()`, `export interface BankTransaction`
- Single default export rare (observed in some UI components: `export { Button, buttonVariants }`)
- Type exports marked with `export type`: `export type BankCode = '...'`
- Constants exported: `export const DEFAULT_CATEGORIES`

**Barrel Files:**
- Used for grouping: `src/lib/bank-rpa/index.ts` and `src/lib/bank-rpa/parsers/index.ts`
- Export main classes/functions from barrel for cleaner imports

**Example structure:**
```typescript
// parsers/index.ts (barrel)
export { BankExcelParser, createExcelParser } from './excel-parser'
export type { BankCode } from './types'
```

**File organization:**
- Feature-based: `src/lib/bank-rpa/` contains all bank-related logic
- Service files grouped: `src/lib/services/` for reportGenerator, alertRuleEngine
- UI components grouped: `src/components/ui/` for all primitive components
- Test files co-located: `src/__tests__/` separate directory with matching structure

---

*Convention analysis: 2026-02-09*
