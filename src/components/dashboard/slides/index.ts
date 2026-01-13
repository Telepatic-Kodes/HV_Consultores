// Slides System - Sistema de presentación ejecutiva

// Container principal
export { SlideContainer } from './slide-container'

// Templates de slides
export {
  SlideLayout,
  TitleSlide,
  KPISlide,
  ChartSlide,
  ComparisonSlide,
  InsightSlide,
  SummarySlide,
  TableSlide,
} from './slide-templates'

// Builder para generar decks completos
export { SlideBuilder, buildExecutiveDeck } from './slide-builder'
