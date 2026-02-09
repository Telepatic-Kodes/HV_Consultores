# Testing Patterns

**Analysis Date:** 2026-02-09

## Test Framework

**Runner:**
- Vitest 1.2.0
- Config: `vitest.config.ts` in project root
- RPA server also uses Vitest with `vitest.e2e.config.ts` for end-to-end tests

**Assertion Library:**
- Vitest built-in expect API (no separate library needed)

**Run Commands:**
```bash
npm test              # Run all tests in watch mode
npm run test:run      # Run tests once (CI mode)
npm run test:coverage # Run tests with coverage report
```

**Coverage Configuration:**
- Reporters: `['text', 'json', 'html']`
- Excludes: `node_modules/`, `.next/`, `src/__tests__/**`
- Output likely to `coverage/` directory

**Environment:**
- `environment: 'node'` in vitest config
- Global test functions available (no imports needed due to `globals: true`)
- Alias resolution: `@/` paths work in tests via config

## Test File Organization

**Location:**
- Tests co-located in `src/__tests__/` directory
- Pattern: Tests separate from source but in same project

**Naming:**
- Pattern: `*.test.ts` or `*.test.tsx`
- Found files: `rules-engine.test.ts`, `parsers.test.ts`, `normalizer.test.ts`, `sii-matcher.test.ts`, `phase6.test.ts`, `phase7-week2.test.ts`, `phase7-week3.test.ts`
- Semantic naming: Tests named after feature/module being tested

**Structure:**
```
src/__tests__/
├── bank-rpa/
│   ├── rules-engine.test.ts
│   ├── parsers.test.ts
│   ├── normalizer.test.ts
│   └── sii-matcher.test.ts
├── phase6.test.ts
├── phase7-week2.test.ts
└── phase7-week3.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { importedFunction } from '@/lib/feature'
import type { ImportedType } from '@/lib/types'

describe('Feature Category', () => {
  let setupVariable: Type

  beforeEach(() => {
    // Reset/initialize before each test
    setupVariable = defaultValue()
  })

  describe('Nested Feature', () => {
    it('should do specific thing', () => {
      // Arrange
      const input = setup()

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toBe(expectedValue)
    })
  })
})
```

**Patterns:**
- Top-level `describe()` blocks organize by feature
- Nested `describe()` blocks organize sub-features
- `beforeEach()` for setup (not `before()` observed)
- Flat assertion style: `expect(value).toBe()` not chained

**Example from rules-engine.test.ts:**
```typescript
describe('CategorizationRulesEngine', () => {
  let engine: CategorizationRulesEngine

  beforeEach(() => {
    engine = createRulesEngine()
  })

  describe('loadRules', () => {
    it('should load and sort rules by priority', () => {
      const rules = [
        createMockRule({ id: 'rule-1', prioridad: 100 }),
        createMockRule({ id: 'rule-2', prioridad: 50 }),
      ]

      engine.loadRules(rules)
      const stats = engine.getStats()

      expect(stats.totalRules).toBe(3)
      expect(stats.activeRules).toBe(3)
    })
  })
})
```

## Mocking

**Framework:** Vitest's `vi` module (imported when needed)

**Patterns:**
```typescript
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Mock function tracking
const mockFunction = vi.fn()

// Mock implementation
vi.fn(() => true)

// Spy on function calls
vi.spyOn(object, 'method')
```

**Observances:**
- Minimal mocking in observed tests
- Direct function testing preferred over spying
- Mock data created via factory functions rather than `vi.mock()`

**What to Mock:**
- External services (email, webhooks, Slack)
- Database calls (though tests often avoid this)
- Time-dependent operations (cron, delays)
- Random operations (success rates, IDs)

**What NOT to Mock:**
- Core business logic (rules engine, parser logic)
- Type constructors and interfaces
- Data transformation utilities
- Validation functions

**Example from phase6.test.ts:**
```typescript
// No vi.mock() seen - uses direct testing
it('should calculate exponential backoff', () => {
  const calcularBackoff = (intento: number, baseSegundos: number = 60) => {
    return Math.pow(2, intento) * baseSegundos
  }

  expect(calcularBackoff(0)).toBe(60)
  expect(calcularBackoff(1)).toBe(120)
})

// Simulated operations instead of mocking
const exito = Math.random() > 0.3 // 70% success rate in test
if (exito) {
  expect(true).toBe(true)
}
```

## Fixtures and Factories

**Test Data:**
```typescript
// Factory pattern for creating test data
const createMockTransaction = (overrides: Partial<BankTransaction> = {}): BankTransaction => ({
  id: 'tx-123',
  cuenta_id: 'cuenta-123',
  fecha: '2026-01-15',
  descripcion: 'TRANSFERENCIA ELECTRONICA',
  monto: 50000,
  tipo: 'cargo',
  ...overrides,
})

const createMockRule = (overrides: Partial<CategorizationRule> = {}): CategorizationRule => ({
  id: 'rule-123',
  nombre: 'Test Rule',
  categoria_id: 'cat-001',
  activa: true,
  ...overrides,
})

// Usage
it('should test with custom data', () => {
  const tx = createMockTransaction({ monto: 100000 })
  const result = process(tx)
  expect(result).toBeDefined()
})
```

**Location:**
- Defined at top of test file after imports
- Section-separated with comments: `// =============================================================================`
- Grouped by entity type (Transaction, Rule, Category, etc.)

**Patterns:**
- Always provide complete default values
- Support override mechanism via parameter
- Spread operator for merges
- Type-safe defaults matching real interfaces

## Coverage

**Requirements:** No explicit minimum enforced

**View Coverage:**
```bash
npm run test:coverage
# Outputs to console (text format)
# Generates HTML report in coverage/index.html
# Generates JSON in coverage/coverage-final.json
```

**Coverage gaps observed:**
- Unit tests focus on core logic (rules engine, parsers, normalizer)
- Integration tests separate in phase6, phase7 files
- E2E tests configured but patterns less visible
- Many TODO comments indicate incomplete coverage

## Test Types

**Unit Tests:**
- Scope: Individual functions and classes
- Approach: Test in isolation with factories/fixtures
- Examples: `rules-engine.test.ts` (300+ lines), `parsers.test.ts` (560 lines)
- Coverage: Logic branches, edge cases, error conditions
- Pattern: Direct function calls with assertions

**Integration Tests:**
- Scope: Multiple components working together
- Approach: Workflow simulation without actual external services
- Examples: `phase6.test.ts` integration section (lines 304-382)
- Pattern: Multiple setup steps + operation + assertion

**E2E Tests:**
- Framework: Vitest with separate `vitest.e2e.config.ts`
- Location: RPA server (`rpa-server/`)
- Pattern: Full workflow from input to result storage

## Common Patterns

**Async Testing:**
```typescript
// From phase6.test.ts
it('should handle complete automation workflow', async () => {
  // Setup
  const rule = { id: 'rule-123', acciones: ['ARCHIVE'] }
  const job = { id: 'job-123', estado: 'completed' }

  // Assert
  expect(job.resultado.archivados).toBeGreaterThan(0)
})

// Note: No await calls shown - async keyword without actual async operations
```

**Error Testing:**
```typescript
// From phase6.test.ts
it('should handle email service errors', () => {
  const enviarEmail = () => {
    throw new Error('SMTP connection failed')
  }

  expect(() => enviarEmail()).toThrow('SMTP connection failed')
})

// Wraps function in lambda to catch exceptions
```

**Batch/Collection Testing:**
```typescript
// From rules-engine.test.ts
it('should categorize multiple transactions', () => {
  const transactions = [
    createMockTransaction({ id: 'tx-1', descripcion: 'TRANSFERENCIA' }),
    createMockTransaction({ id: 'tx-2', descripcion: 'COMISION MENSUAL' }),
    createMockTransaction({ id: 'tx-3', descripcion: 'DESCONOCIDO' }),
  ]

  const results = engine.categorizeMany(transactions)

  expect(results.size).toBe(3)
  expect(results.get('tx-1')?.categoria_id).toBe('cat-trf')
  expect(results.get('tx-3')).toBeNull()
})
```

**Edge Case Testing:**
```typescript
// From rules-engine.test.ts - Edge Cases section
describe('Edge Cases', () => {
  it('should handle empty rules array', () => {
    engine.loadRules([])
    const tx = createMockTransaction()
    const result = engine.categorize(tx)
    expect(result).toBeNull()
  })

  it('should handle invalid regex pattern gracefully', () => {
    const badRule = createMockRule({ patron_descripcion: ['[invalid(regex'] })
    engine.loadRules([badRule])
    const tx = createMockTransaction()

    expect(() => engine.categorize(tx)).not.toThrow()
  })

  it('should be case-insensitive for keyword matching', () => {
    engine.loadRules([createMockRule({ palabras_clave: ['transferencia'] })])
    const tx = createMockTransaction({ descripcion: 'TRANSFERENCIA GRANDE' })
    const result = engine.categorize(tx)

    expect(result?.categoria_id).toBe('cat-trf')
  })
})
```

**Internal Logic Testing:**
```typescript
// From parsers.test.ts - Test internal parsing logic
describe('Amount Parsing Logic', () => {
  const parseAmount = (value: string): number | undefined => {
    // Function defined inline for testing
    if (!value || value.trim() === '') return undefined
    // Implementation...
    return isNegative ? -amount : amount
  }

  it('should parse Chilean format (comma as decimal)', () => {
    expect(parseAmount('50000,50')).toBe(50000.50)
    expect(parseAmount('1.234.567,89')).toBe(1234567.89)
  })

  it('should return undefined for invalid input', () => {
    expect(parseAmount('')).toBeUndefined()
    expect(parseAmount('abc')).toBeUndefined()
  })
})
```

**Options/Configuration Testing:**
```typescript
// From rules-engine.test.ts
describe('RulesEngineOptions', () => {
  it('should respect useKeywordFallback option', () => {
    const engine = createRulesEngine({ useKeywordFallback: false })
    engine.loadCategories([createMockCategory()])

    const tx = createMockTransaction({ descripcion: 'VENTA PRODUCTO' })
    const result = engine.categorize(tx)

    expect(result).toBeNull()
  })

  it('should respect prioritizeClientRules option', () => {
    const engineWithPriority = createRulesEngine({ prioritizeClientRules: true })
    const engineWithoutPriority = createRulesEngine({ prioritizeClientRules: false })

    // Test both configurations
  })
})
```

## Test Sections and Organization

Files are organized with major section dividers:

```typescript
// =============================================================================
// TEST DATA FACTORIES
// =============================================================================
// All factory functions grouped

// =============================================================================
// UNIT TEST SECTION NAME
// =============================================================================
describe('Feature', () => {
  // Tests for that feature
})

// =============================================================================
// UTILITY FUNCTIONS TESTS
// =============================================================================
describe('utilityFunction', () => {
  // Tests for utility
})

// =============================================================================
// EDGE CASES
// =============================================================================
describe('Edge Cases', () => {
  // Edge case tests grouped
})

// =============================================================================
// INTEGRATION TESTS
// =============================================================================
describe('Integration', () => {
  // Integration tests
})

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================
describe('Error Handling', () => {
  // Error scenario tests
})
```

---

*Testing analysis: 2026-02-09*
