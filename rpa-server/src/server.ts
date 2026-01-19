// HV Consultores - SII RPA Server
// Express Server Configuration

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { BrowserManager } from './automation/browser-manager'
import { TaskExecutor } from './tasks/task-executor'
import { logger } from './utils/logger'
import { validateApiKey } from './middleware/auth'

export function createServer(browserManager: BrowserManager) {
  const app = express()

  // Middleware
  app.use(helmet())
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  }))
  app.use(express.json({ limit: '10mb' }))

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' },
  })
  app.use('/api', limiter)

  // Task executor
  const taskExecutor = new TaskExecutor(browserManager)

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      serverName: process.env.SERVER_NAME || 'rpa-server',
      activeBrowsers: browserManager.getActiveBrowserCount(),
      timestamp: new Date().toISOString(),
    })
  })

  // API Routes
  const apiRouter = express.Router()
  apiRouter.use(validateApiKey)

  // Execute task
  apiRouter.post('/execute', async (req: Request, res: Response) => {
    try {
      const { jobId, taskType, credentials, params } = req.body

      if (!jobId || !taskType || !credentials) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: jobId, taskType, credentials',
        })
      }

      // Execute task asynchronously
      taskExecutor.executeTask({
        jobId,
        taskType,
        credentials,
        params: params || {},
      })

      res.json({
        success: true,
        message: 'Task started',
        jobId,
      })
    } catch (error) {
      logger.error('Execute task error', { error })
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  // Get task status
  apiRouter.get('/status/:jobId', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params
      const status = taskExecutor.getTaskStatus(jobId)

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        })
      }

      res.json({
        success: true,
        ...status,
      })
    } catch (error) {
      logger.error('Get status error', { error })
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  // Cancel task
  apiRouter.post('/cancel/:jobId', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params
      const cancelled = await taskExecutor.cancelTask(jobId)

      res.json({
        success: cancelled,
        message: cancelled ? 'Task cancelled' : 'Task not found or already completed',
      })
    } catch (error) {
      logger.error('Cancel task error', { error })
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  // Server stats
  apiRouter.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = {
        activeTasks: taskExecutor.getActiveTaskCount(),
        activeBrowsers: browserManager.getActiveBrowserCount(),
        maxBrowsers: browserManager.getMaxBrowsers(),
        serverName: process.env.SERVER_NAME || 'rpa-server',
        uptime: process.uptime(),
      }

      res.json({
        success: true,
        stats,
      })
    } catch (error) {
      logger.error('Get stats error', { error })
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  app.use('/api', apiRouter)

  // Error handling
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack })
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  })

  return app
}
