# Dashboard Redesign — Bento Grid Layout

**Date:** 2026-02-15
**Status:** Approved

## Problem

The current dashboard is too dense (8 KPIs + 4 stats + 4 charts + modules + activity + quick actions), lacks visual hierarchy, feels dated, and doesn't provide actionable context. Users alternate between executive overview and operational execution, but the flat layout doesn't serve either mode well.

## Design Decision

**Approach: Bento Grid** — Asymmetric grid layout inspired by Linear/Vercel. Each block has visual weight proportional to its importance. All existing data is preserved but reorganized.

## Layout Structure

```
┌─────────────────────┬────────┬────────┬────────┐
│  Hero: Greeting +   │ KPI:   │ KPI:   │ KPI:   │
│  Contextual summary │Clientes│Docs Mes│F29 Pend│
├─────────────────────┴────────┴──┬─────┴────────┤
│  KPI: Precisión IA              │ Stat bar:    │
│                                 │ Chat|Bots|   │
│                                 │ Conc|Tasa    │
├─────────────────────────────────┼──────────────┤
│  Documentos por Día (chart)     │  Actividad   │
│  (2/3 width, main visual)      │  Reciente    │
│                                 │  (timeline)  │
├────────────────┬────────────────┼──────────────┤
│ Docs por Tipo  │  F29 por Mes   │  Acciones    │
│ (bar chart)    │  (bar chart)   │  Rápidas     │
├────────────────┴────────────────┤  (4 buttons) │
│  Módulos (2x2) + Bots Activity  │              │
└─────────────────────────────────┴──────────────┘
```

## Section Details

### 1. Header Zone — Hero + Primary KPIs

**Hero Block (~40% width):**
- User name + formatted date
- Contextual 1-line summary: "Tienes X documentos pendientes y Y alertas F29"
- Style: `bg-card` with subtle border, no heavy gradients

**3 Primary KPI Cards (right):**
- Clientes Activos, Docs del Mes, F29 Pendientes
- Large value + small label + trend indicator or sparkline
- Subtle color accent (left border or dot)

### 2. Secondary KPIs Row

**Precisión IA** — larger card on left (1 primary KPI that needs more visual space)

**Stat Bar** — compact single-line display for 4 secondary KPIs:
- Chat Consultas | Bots Ejecutados | Por Conciliar | Tasa Conciliación
- Values separated by vertical dividers
- Less prominent but always visible

### 3. Main Charts + Activity

**Documentos por Día (2/3 width):**
- Primary chart, largest visual element
- Gradient fill under line
- Clean tooltip, no redundant legends
- Header with clickable range selector (7d/30d/90d)

**Actividad Reciente (1/3 width):**
- Vertical timeline with colored dots by type
- Icon + text + relative time per item
- Internal scroll if >5 items
- Footer link "Ver toda la actividad"

### 4. Secondary Charts Row

**Documentos por Tipo (50%):** Horizontal bar chart (easier to read than pie)
**F29 por Mes (50%):** Grouped bar chart (borradores vs enviados)

### 5. Bottom Zone — Modules, Bots, Quick Actions

**Módulos del Sistema (1/2 width):**
- Compact 2x2 grid
- Each module: name + status badge + metric in single line
- Dot indicator (green/yellow/red) instead of large badge
- Hover to expand with module link

**Bots Actividad:** Stacked horizontal bar chart (exitosos/fallidos/pendientes)

**Acciones Rápidas (1/4 width, spans 2 rows):**
- 4 vertically stacked ghost buttons with icon + label
- Hover reveals gradient accent
- Compact — no large icon cards

## Visual Style

- **Colors:** `background` base, `card` for items, `border-border/40`
- **Spacing:** Uniform `gap-4` between bento items
- **Borders:** 1px, `rounded-xl`, subtle color
- **Typography:** System font, `tabular-nums` for data, large values in `text-2xl font-semibold`, labels in `text-xs text-muted-foreground uppercase tracking-wide`
- **Animations:** Hover only (scale 1.01 on cards), no entry animations
- **Dark mode:** Full support via existing CSS variables
- **No decorative icons** — clean data-focused presentation

## Technical Notes

- Server Component preserved (`page.tsx` stays async)
- Same `actions.ts` data fetching — no backend changes needed
- `Promise.all` parallel loading preserved
- Existing Recharts library for charts
- Tailwind CSS grid for bento layout
- Add contextual summary logic to `getDashboardStats` (minor)

## Out of Scope

- Sidebar redesign (separate effort)
- New data sources or backend changes
- Mobile-specific layout (responsive via existing breakpoints)
