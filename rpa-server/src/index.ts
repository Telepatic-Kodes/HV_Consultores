// HV Consultores - SII RPA Server
// Entry Point

import dotenv from 'dotenv'
dotenv.config()

import { createServer } from './server'
import { BrowserManager } from './automation/browser-manager'
import { logger } from './utils/logger'

const PORT = process.env.PORT || 3001
const SERVER_NAME = process.env.SERVER_NAME || 'rpa-server-1'

async function main() {
  logger.info('Starting SII RPA Server...', { serverName: SERVER_NAME })

  // Initialize browser pool
  const browserManager = BrowserManager.getInstance()
  await browserManager.initialize()

  // Create and start Express server
  const app = createServer(browserManager)

  app.listen(PORT, () => {
    logger.info(`SII RPA Server running on port ${PORT}`, {
      serverName: SERVER_NAME,
      port: PORT,
    })
  })

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`)

    try {
      await browserManager.closeAll()
      logger.info('Browser pool closed')
      process.exit(0)
    } catch (error) {
      logger.error('Error during shutdown', { error })
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((error) => {
  logger.error('Failed to start server', { error })
  process.exit(1)
})
