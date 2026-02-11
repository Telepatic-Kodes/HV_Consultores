'use client'

// =============================================================================
// MatchingWorkspace - Split-panel reconciliation interface
// Left: Bank transactions | Right: Suggested document matches
// =============================================================================

import { useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Zap,
  Loader2,
  Search,
  Filter,
} from 'lucide-react'
import { ReconciliationStats } from './ReconciliationStats'
import { ReconciliationSummaryBar } from './ReconciliationSummaryBar'
import { MatchConfirmDialog } from './MatchConfirmDialog'
import { BatchMatchButton } from './BatchMatchButton'

// =============================================================================
// Types
// =============================================================================

interface MatchingWorkspaceProps {
  clienteId: string
  clienteNombre?: string
}

interface MatchCandidate {
  documento: any
  score: number
  reasons: string[]
  diferencia_monto: number
  diferencia_dias: number
}

// =============================================================================
// Status helpers
// =============================================================================

const statusConfig = {
  matched: { label: 'Conciliado', color: 'bg-green-500', textColor: 'text-green-600', icon: CheckCircle },
  partial: { label: 'Parcial', color: 'bg-blue-500', textColor: 'text-blue-600', icon: AlertCircle },
  unmatched: { label: 'Sin match', color: 'bg-red-500', textColor: 'text-red-600', icon: XCircle },
  pending: { label: 'Pendiente', color: 'bg-amber-500', textColor: 'text-amber-600', icon: Clock },
  manual: { label: 'Manual', color: 'bg-purple-500', textColor: 'text-purple-600', icon: FileText },
} as const

// =============================================================================
// Component
// =============================================================================

export function MatchingWorkspace({ clienteId, clienteNombre }: MatchingWorkspaceProps) {
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    transactionDesc: string
    documentFolio: string
    documentType: string
    documentId: string
    score: number
  } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  // Convex queries (reactive)
  const unmatchedTx = useQuery(api.matching.getUnmatchedTransactions, {
    clienteId: clienteId as Id<'clientes'>,
    periodo: statusFilter === 'pending' ? periodo : undefined,
  })

  const stats = useQuery(api.matching.getMatchingStats, {
    clienteId: clienteId as Id<'clientes'>,
    periodo,
  })

  const suggestedMatches = useQuery(
    api.matching.getSuggestedMatches,
    selectedTxId ? { transactionId: selectedTxId as Id<'bancos_transacciones'> } : 'skip'
  )

  // Mutations
  const confirmMatch = useMutation(api.matching.confirmMatch)
  const rejectMatch = useMutation(api.matching.rejectMatch)
  const runBatch = useMutation(api.matching.runBatchMatching)

  // Handlers
  const handleConfirmMatch = useCallback(async (notas: string) => {
    if (!confirmDialog || !selectedTxId) return

    await confirmMatch({
      transactionId: selectedTxId as Id<'bancos_transacciones'>,
      documentId: confirmDialog.documentId as Id<'documentos'>,
      notas: notas || undefined,
    })

    setConfirmDialog(null)
    setSelectedTxId(null)
  }, [confirmDialog, selectedTxId, confirmMatch])

  const handleRejectMatch = useCallback(async () => {
    if (!selectedTxId) return

    await rejectMatch({
      transactionId: selectedTxId as Id<'bancos_transacciones'>,
    })

    setSelectedTxId(null)
  }, [selectedTxId, rejectMatch])

  const handleBatchComplete = useCallback(() => {
    setSelectedTxId(null)
  }, [])

  // Period options (last 6 months)
  const periodOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  const transactions = unmatchedTx ?? []
  const isLoading = unmatchedTx === undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
            Conciliación
            {clienteNombre && (
              <span className="text-muted-foreground font-normal text-lg">
                — {clienteNombre}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Concilia transacciones bancarias con documentos SII
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <BatchMatchButton
            clienteId={clienteId}
            periodo={periodo}
            onBatchComplete={handleBatchComplete}
          />
        </div>
      </div>

      {/* Stats */}
      {stats && <ReconciliationStats stats={stats} />}

      {/* Summary Bar */}
      {stats && (
        <ReconciliationSummaryBar
          matched={stats.matched}
          partial={stats.partial}
          unmatched={stats.unmatched}
          pending={stats.pending}
          total={stats.total}
        />
      )}

      {/* Split Panel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: Transactions */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Transacciones</CardTitle>
                <CardDescription className="text-xs">
                  {transactions.length} pendientes de conciliar
                </CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-sm font-medium">Todo conciliado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No hay transacciones pendientes en este período
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((tx) => {
                    const isSelected = selectedTxId === tx._id
                    const isCargo = tx.monto < 0 || tx.tipo === 'cargo'
                    const status = statusConfig[tx.estado_conciliacion as keyof typeof statusConfig] || statusConfig.pending
                    const StatusIcon = status.icon

                    return (
                      <button
                        key={tx._id}
                        onClick={() => setSelectedTxId(tx._id)}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`p-1.5 rounded-md ${
                              isCargo
                                ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                                : 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
                            }`}>
                              {isCargo ? (
                                <TrendingDown className="h-3.5 w-3.5" />
                              ) : (
                                <TrendingUp className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {tx.descripcion}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{new Date(tx.fecha).toLocaleDateString('es-CL')}</span>
                                {tx.categoria && (
                                  <>
                                    <span>·</span>
                                    <span>{tx.categoria}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-semibold ${
                              isCargo ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {isCargo ? '-' : '+'}${Math.abs(tx.monto).toLocaleString('es-CL')}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <StatusIcon className={`h-3 w-3 ${status.textColor}`} />
                              <span className={`text-[10px] font-medium ${status.textColor}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* RIGHT: Match Candidates */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Candidatos
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedTxId
                ? 'Documentos SII sugeridos para esta transacción'
                : 'Selecciona una transacción para ver candidatos'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedTxId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Selecciona una transacción del panel izquierdo
                </p>
              </div>
            ) : suggestedMatches === undefined ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : suggestedMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Sin candidatos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No se encontraron documentos que coincidan
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleRejectMatch}
                >
                  Marcar como sin match
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestedMatches.map((candidate: MatchCandidate, idx: number) => {
                  const doc = candidate.documento
                  const scorePercent = Math.round(candidate.score * 100)
                  const scoreColor = candidate.score >= 0.7
                    ? 'text-green-600'
                    : candidate.score >= 0.5
                    ? 'text-amber-600'
                    : 'text-red-600'
                  const progressColor = candidate.score >= 0.7
                    ? '[&>div]:bg-green-500'
                    : candidate.score >= 0.5
                    ? '[&>div]:bg-amber-500'
                    : '[&>div]:bg-red-500'

                  return (
                    <Card key={doc._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {/* Top: Type + Folio + Score */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {doc.tipo_documento}
                            </Badge>
                            <span className="text-sm font-semibold">#{doc.folio}</span>
                            {idx === 0 && candidate.score >= 0.7 && (
                              <Badge className="bg-green-500 text-white text-[10px]">
                                Mejor match
                              </Badge>
                            )}
                          </div>
                          <span className={`text-lg font-bold ${scoreColor}`}>
                            {scorePercent}%
                          </span>
                        </div>

                        {/* Confidence bar */}
                        <Progress
                          value={scorePercent}
                          className={`h-1.5 mb-3 ${progressColor}`}
                        />

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-muted-foreground">RUT:</span>{' '}
                            <span className="font-mono">{doc.rut_emisor}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fecha:</span>{' '}
                            {new Date(doc.fecha_emision).toLocaleDateString('es-CL')}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monto:</span>{' '}
                            <span className="font-semibold">
                              ${(doc.monto_total || 0).toLocaleString('es-CL')}
                            </span>
                          </div>
                          {doc.razon_social_emisor && (
                            <div className="truncate">
                              <span className="text-muted-foreground">Emisor:</span>{' '}
                              {doc.razon_social_emisor}
                            </div>
                          )}
                        </div>

                        {/* Reasons */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {candidate.reasons.map((reason: string, i: number) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px] bg-primary/10 text-primary"
                            >
                              {reason}
                            </Badge>
                          ))}
                        </div>

                        {/* Differences */}
                        {(candidate.diferencia_monto > 0 || candidate.diferencia_dias > 0) && (
                          <div className="flex gap-3 text-[10px] text-muted-foreground mb-3">
                            {candidate.diferencia_monto > 0 && (
                              <span>Δ monto: ${candidate.diferencia_monto.toLocaleString('es-CL')}</span>
                            )}
                            {candidate.diferencia_dias > 0 && (
                              <span>Δ días: {candidate.diferencia_dias}</span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              const selectedTx = transactions.find((t) => t._id === selectedTxId)
                              setConfirmDialog({
                                open: true,
                                transactionDesc: selectedTx?.descripcion || '',
                                documentFolio: doc.folio,
                                documentType: doc.tipo_documento,
                                documentId: doc._id,
                                score: candidate.score,
                              })
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRejectMatch}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <MatchConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null)
          }}
          transactionDescription={confirmDialog.transactionDesc}
          documentFolio={confirmDialog.documentFolio}
          documentType={confirmDialog.documentType}
          score={confirmDialog.score}
          onConfirm={handleConfirmMatch}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
