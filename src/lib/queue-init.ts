// Queue & Scheduler Initialization
// Call this on application startup

import { queue, scheduler } from './queue'
import {
  handleEmailJob,
  handleWebhookJob,
  handleArchiveJob,
  handleDeleteJob,
  handleNotificationJob,
  handleReportJob,
} from './queue'

/**
 * Initialize job queue system
 * Call this in your application startup (e.g., in layout.tsx or api/init route)
 */
export async function initializeQueue(): Promise<void> {
  console.log('Initializing job queue and scheduler...')

  // Register job handlers
  const handlers = {
    email: handleEmailJob,
    webhook: handleWebhookJob,
    archive: handleArchiveJob,
    delete: handleDeleteJob,
    notification: handleNotificationJob,
    report: handleReportJob,
  }

  // Start processing queue (every 10 seconds)
  queue.startProcessing(handlers, 10)

  console.log('Job queue initialized and processing started')
}

/**
 * Initialize scheduled jobs
 * Call this after initializeQueue()
 */
export async function initializeScheduler(): Promise<void> {
  console.log('Initializing scheduler...')

  // Schedule daily document expiration check (2 AM daily)
  scheduler.scheduleJob('check-expired-documents', '0 2 *', async () => {
    console.log('Running: Check expired documents')
    // This will trigger automation rules execution
  })

  // Schedule daily automation rules execution (3 AM daily)
  scheduler.scheduleJob('execute-automation-rules', '0 3 *', async () => {
    console.log('Running: Execute automation rules')
    // Query all active rules and execute them
  })

  // Schedule daily summary emails (8 AM daily)
  scheduler.scheduleJob('send-daily-summaries', '0 8 *', async () => {
    console.log('Running: Send daily summaries')
    // Query users with daily summary preference and send
  })

  // Schedule weekly data cleanup (Sunday 1 AM)
  scheduler.scheduleJob('weekly-cleanup', '0 1 0', async () => {
    console.log('Running: Weekly cleanup')
    // Clean up old logs, failed jobs, etc.
  })

  console.log('Scheduler initialized with scheduled jobs')
}

/**
 * Shutdown queue and scheduler
 * Call this on application shutdown
 */
export async function shutdownQueue(): Promise<void> {
  console.log('Shutting down queue and scheduler...')
  queue.stopProcessing()
  scheduler.cancelAll()
  console.log('Queue and scheduler shutdown complete')
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  return await queue.getStats()
}
