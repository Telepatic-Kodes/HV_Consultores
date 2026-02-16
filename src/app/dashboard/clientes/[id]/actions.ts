'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

export interface ClienteOverview {
  cliente: any
  documentStats: {
    total: number
    pendiente: number
    clasificado: number
    revisado: number
    aprobado: number
    exportado: number
    todayCount: number
    clasificadosHoy: number
  }
  recentDocs: any[]
  f29Stats: {
    total: number
    borrador: number
    calculado: number
    validado: number
    aprobado: number
    enviado: number
    totalPagar: number
  }
  f29Submissions: any[]
  bankStats: {
    total: number
    reconciliadas: number
    pendientes: number
    ingresos: number
    egresos: number
    balance: number
    porCategoria: Record<string, { count: number; total: number }>
  }
  recentTransactions: any[]
  alertStats: {
    total: number
    abiertas: number
    alta: number
    media: number
    baja: number
    resueltas: number
    descartadas: number
  }
  recentAlerts: any[]
  pipelineRuns: any[]
}

const emptyOverview: ClienteOverview = {
  cliente: null,
  documentStats: { total: 0, pendiente: 0, clasificado: 0, revisado: 0, aprobado: 0, exportado: 0, todayCount: 0, clasificadosHoy: 0 },
  recentDocs: [],
  f29Stats: { total: 0, borrador: 0, calculado: 0, validado: 0, aprobado: 0, enviado: 0, totalPagar: 0 },
  f29Submissions: [],
  bankStats: { total: 0, reconciliadas: 0, pendientes: 0, ingresos: 0, egresos: 0, balance: 0, porCategoria: {} },
  recentTransactions: [],
  alertStats: { total: 0, abiertas: 0, alta: 0, media: 0, baja: 0, resueltas: 0, descartadas: 0 },
  recentAlerts: [],
  pipelineRuns: [],
}

export async function getClienteOverview(clienteId: string): Promise<ClienteOverview> {
  try {
    if (!convex) throw new Error('Convex client not initialized')

    const id = clienteId as Id<"clientes">

    const [
      cliente,
      documentStats,
      recentDocs,
      f29Stats,
      f29Submissions,
      bankStats,
      recentTransactions,
      alertStats,
      recentAlerts,
      pipelineRuns,
    ] = await Promise.all([
      convex.query(api.clients.getClient, { id }),
      convex.query(api.documents.getDocumentStats, { clienteId: id }),
      convex.query(api.documents.listDocuments, { clienteId: id, limit: 5 }),
      convex.query(api.f29.getF29Stats, { clienteId: id }),
      convex.query(api.f29.listSubmissions, { clienteId: id }),
      convex.query(api.banks.getTransactionStats, { clienteId: id }),
      convex.query(api.banks.listTransactions, { clienteId: id, limit: 10 }),
      convex.query(api.anomalies.getAlertStats, { clienteId: id }),
      convex.query(api.anomalies.getAlerts, { clienteId: id, limit: 5 }),
      convex.query(api.pipeline.getPipelineRuns, { clienteId: id, limit: 5 }),
    ])

    return {
      cliente,
      documentStats,
      recentDocs,
      f29Stats,
      f29Submissions,
      bankStats,
      recentTransactions,
      alertStats,
      recentAlerts,
      pipelineRuns,
    }
  } catch (error) {
    console.error('Error fetching cliente overview:', error)
    return emptyOverview
  }
}
