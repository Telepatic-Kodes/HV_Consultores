'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EXECUTIVE_COLORS } from '../executive-charts/chart-utils'

interface SummaryTableColumn {
  key: string
  label: string
  type?: 'text' | 'number' | 'currency' | 'percent'
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface SummaryTableRow {
  id: string
  data: Record<string, string | number>
  children?: SummaryTableRow[]
  isTotal?: boolean
  highlight?: boolean
}

interface GroupedSummaryTableProps {
  title?: string
  subtitle?: string
  columns: SummaryTableColumn[]
  rows: SummaryTableRow[]
  expandable?: boolean
  defaultExpanded?: boolean
  showGrandTotal?: boolean
  grandTotalLabel?: string
  className?: string
}

export function GroupedSummaryTable({
  title,
  subtitle,
  columns,
  rows,
  expandable = true,
  defaultExpanded = true,
  showGrandTotal = true,
  grandTotalLabel = 'Gran Total',
  className = '',
}: GroupedSummaryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    defaultExpanded ? new Set(rows.map((r) => r.id)) : new Set()
  )

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Format value based on type
  const formatValue = (value: string | number, type?: string) => {
    if (typeof value === 'string') return value
    switch (type) {
      case 'currency':
        if (Math.abs(value) >= 1000000) {
          return `$${(value / 1000000).toFixed(1)}M`
        }
        if (Math.abs(value) >= 1000) {
          return `$${(value / 1000).toFixed(0)}K`
        }
        return `$${value.toLocaleString('es-CL')}`
      case 'percent':
        return `${value.toFixed(1)}%`
      case 'number':
        return value.toLocaleString('es-CL')
      default:
        return value.toString()
    }
  }

  // Calculate grand total
  const calculateGrandTotal = () => {
    const totals: Record<string, number> = {}

    rows.forEach((row) => {
      columns.forEach((col) => {
        if (col.type === 'number' || col.type === 'currency' || col.type === 'percent') {
          const value = row.data[col.key]
          if (typeof value === 'number') {
            totals[col.key] = (totals[col.key] || 0) + value
          }
        }
      })
    })

    return totals
  }

  const grandTotals = showGrandTotal ? calculateGrandTotal() : {}

  // Render row
  const renderRow = (row: SummaryTableRow, level: number = 0): React.ReactNode => {
    const hasChildren = row.children && row.children.length > 0
    const isExpanded = expandedRows.has(row.id)
    const indent = level * 20

    return (
      <>
        <tr
          key={row.id}
          className={`
            ${row.isTotal ? 'font-semibold' : ''}
            ${row.highlight ? 'bg-muted/30' : ''}
            ${level === 0 && hasChildren ? 'bg-muted/20' : ''}
            hover:bg-muted/10 transition-colors
          `}
        >
          {columns.map((col, colIndex) => {
            const value = row.data[col.key]
            const isFirstColumn = colIndex === 0
            const align = col.align || (col.type === 'number' || col.type === 'currency' || col.type === 'percent' ? 'right' : 'left')

            return (
              <td
                key={col.key}
                className={`px-4 py-3 text-sm border-b ${
                  row.isTotal ? 'border-t-2' : ''
                }`}
                style={{
                  textAlign: align,
                  width: col.width,
                  paddingLeft: isFirstColumn ? `${16 + indent}px` : undefined,
                  color: row.isTotal ? EXECUTIVE_COLORS.primary : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  {isFirstColumn && expandable && hasChildren && (
                    <button
                      onClick={() => toggleRow(row.id)}
                      className="p-0.5 hover:bg-muted rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )}
                  {isFirstColumn && expandable && !hasChildren && level > 0 && (
                    <span className="w-5" /> // Spacer
                  )}
                  <span className={`font-mono ${row.isTotal ? 'font-bold' : ''}`}>
                    {formatValue(value, col.type)}
                  </span>
                </div>
              </td>
            )
          })}
        </tr>

        {/* Children rows */}
        {hasChildren &&
          isExpanded &&
          row.children!.map((child) => renderRow(child, level + 1))}
      </>
    )
  }

  return (
    <Card className={className}>
      {(title || subtitle) && (
        <CardHeader className="pb-2">
          {title && (
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
              {title}
            </CardTitle>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: EXECUTIVE_COLORS.primary }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white"
                  style={{
                    textAlign: col.align || (col.type === 'number' || col.type === 'currency' || col.type === 'percent' ? 'right' : 'left'),
                    width: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => renderRow(row))}

            {/* Grand Total Row */}
            {showGrandTotal && Object.keys(grandTotals).length > 0 && (
              <tr
                className="font-bold"
                style={{ backgroundColor: `${EXECUTIVE_COLORS.primary}10` }}
              >
                {columns.map((col, colIndex) => {
                  const isFirstColumn = colIndex === 0
                  const value = isFirstColumn ? grandTotalLabel : grandTotals[col.key] || ''
                  const align = col.align || (col.type === 'number' || col.type === 'currency' || col.type === 'percent' ? 'right' : 'left')

                  return (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm border-t-2"
                      style={{
                        textAlign: align,
                        color: EXECUTIVE_COLORS.primary,
                        borderTopColor: EXECUTIVE_COLORS.primary,
                      }}
                    >
                      <span className="font-mono">
                        {typeof value === 'number'
                          ? formatValue(value, col.type)
                          : value}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// Simpler variant without grouping
interface SimpleSummaryTableProps {
  title?: string
  subtitle?: string
  headers: string[]
  rows: (string | number)[][]
  footer?: (string | number)[]
  unit?: 'number' | 'currency' | 'percent'
  highlightLastColumn?: boolean
  className?: string
}

export function SimpleSummaryTable({
  title,
  subtitle,
  headers,
  rows,
  footer,
  unit = 'number',
  highlightLastColumn = true,
  className = '',
}: SimpleSummaryTableProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    switch (unit) {
      case 'currency':
        if (Math.abs(val) >= 1000000) {
          return `$${(val / 1000000).toFixed(1)}M`
        }
        return `$${val.toLocaleString('es-CL')}`
      case 'percent':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString('es-CL')
    }
  }

  return (
    <Card className={className}>
      {(title || subtitle) && (
        <CardHeader className="pb-2">
          {title && (
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
              {title}
            </CardTitle>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: EXECUTIVE_COLORS.primary }}>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white"
                  style={{
                    textAlign: index === 0 ? 'left' : 'right',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${rowIndex % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/30 transition-colors`}
              >
                {row.map((cell, cellIndex) => {
                  const isLastColumn = cellIndex === row.length - 1
                  return (
                    <td
                      key={cellIndex}
                      className={`px-4 py-3 text-sm border-b ${
                        cellIndex === 0 ? '' : 'font-mono'
                      }`}
                      style={{
                        textAlign: cellIndex === 0 ? 'left' : 'right',
                        fontWeight:
                          isLastColumn && highlightLastColumn ? 600 : undefined,
                        color:
                          isLastColumn && highlightLastColumn
                            ? EXECUTIVE_COLORS.primary
                            : undefined,
                      }}
                    >
                      {formatValue(cell)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr
                className="font-bold"
                style={{ backgroundColor: `${EXECUTIVE_COLORS.primary}10` }}
              >
                {footer.map((cell, index) => (
                  <td
                    key={index}
                    className="px-4 py-3 text-sm border-t-2"
                    style={{
                      textAlign: index === 0 ? 'left' : 'right',
                      color: EXECUTIVE_COLORS.primary,
                      borderTopColor: EXECUTIVE_COLORS.primary,
                    }}
                  >
                    <span className="font-mono">{formatValue(cell)}</span>
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </CardContent>
    </Card>
  )
}

export default GroupedSummaryTable
