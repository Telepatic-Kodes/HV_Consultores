// =============================================================================
// HV Consultores - Categorization Module
// Exportaciones centralizadas
// =============================================================================

export * from './rules-engine'

export {
  CategorizationRulesEngine,
  createRulesEngine,
  createRuleFromTransaction,
  suggestRules,
  type CategorizationResult,
  type RulesEngineOptions,
} from './rules-engine'
