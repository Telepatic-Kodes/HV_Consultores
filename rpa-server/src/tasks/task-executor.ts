// HV Consultores - SII RPA Server
// Task Executor - Orchestrates task execution

import { v4 as uuidv4 } from 'uuid'
import { BrowserManager } from '../automation/browser-manager'
import { BaseTask, TaskContext, TaskResult, TaskStatus } from './base-task'
import { LoginTask } from './login.task'
import { SituacionTributariaTask } from './situacion-tributaria.task'
import { LibroComprasTask } from './libro-compras.task'
import { LibroVentasTask } from './libro-ventas.task'
import { F29SubmitTask } from './f29-submit.task'
import { F29DownloadTask } from './f29-download.task'
import { logger } from '../utils/logger'
import { sendWebhook } from '../utils/webhook'

interface ExecuteTaskInput {
  jobId: string
  taskType: string
  credentials: {
    rut: string
    password: string
    authMethod: string
    rutRepresentante?: string
  }
  params: Record<string, unknown>
}

interface RunningTask {
  task: BaseTask
  status: TaskStatus
  startedAt: Date
  aborted: boolean
}

export class TaskExecutor {
  private browserManager: BrowserManager
  private runningTasks: Map<string, RunningTask> = new Map()

  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager
  }

  async executeTask(input: ExecuteTaskInput): Promise<void> {
    const { jobId, taskType, credentials, params } = input
    const sessionId = uuidv4()

    logger.info('Starting task execution', { jobId, taskType })

    // Notify task started
    await sendWebhook(jobId, 'started', { taskType })

    try {
      // Acquire browser
      const { context, page } = await this.browserManager.acquireBrowser(sessionId)

      // Create task context
      const taskContext: TaskContext = {
        jobId,
        sessionId,
        credentials: {
          rut: credentials.rut,
          password: credentials.password,
          authMethod: credentials.authMethod as 'rut_clave' | 'clave_unica' | 'certificado_digital',
          rutRepresentante: credentials.rutRepresentante,
        },
        params,
        page,
        context,
      }

      // Create task instance
      const task = this.createTask(taskType, taskContext)

      if (!task) {
        throw new Error(`Unknown task type: ${taskType}`)
      }

      // Track running task
      this.runningTasks.set(jobId, {
        task,
        status: 'running',
        startedAt: new Date(),
        aborted: false,
      })

      // Execute task
      const result = await task.execute()

      // Update status
      const runningTask = this.runningTasks.get(jobId)
      if (runningTask) {
        runningTask.status = result.success ? 'completed' : 'failed'
      }

      // Send result webhook
      await sendWebhook(jobId, result.success ? 'completed' : 'failed', {
        result: result.data,
        files: result.files,
        error: result.error,
        screenshots: result.screenshots,
        durationMs: result.duration_ms,
      })

      logger.info('Task completed', {
        jobId,
        taskType,
        success: result.success,
        durationMs: result.duration_ms,
      })
    } catch (error) {
      logger.error('Task execution error', { jobId, taskType, error })

      await sendWebhook(jobId, 'failed', {
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    } finally {
      // Cleanup
      this.runningTasks.delete(jobId)
      await this.browserManager.closeBrowser(sessionId)
    }
  }

  getTaskStatus(jobId: string): TaskStatus | null {
    const task = this.runningTasks.get(jobId)
    return task?.status || null
  }

  async cancelTask(jobId: string): Promise<boolean> {
    const runningTask = this.runningTasks.get(jobId)

    if (!runningTask) {
      return false
    }

    runningTask.aborted = true
    runningTask.status = 'cancelled'
    runningTask.task.abort()

    logger.info('Task cancelled', { jobId })
    return true
  }

  getActiveTaskCount(): number {
    return this.runningTasks.size
  }

  private createTask(taskType: string, context: TaskContext): BaseTask | null {
    switch (taskType) {
      case 'login_test':
        return new LoginTask(context)
      case 'situacion_tributaria':
        return new SituacionTributariaTask(context)
      case 'libro_compras':
        return new LibroComprasTask(context)
      case 'libro_ventas':
        return new LibroVentasTask(context)
      case 'f29_submit':
        return new F29SubmitTask(context)
      case 'f29_download':
        return new F29DownloadTask(context)
      // TODO: Add more tasks
      // case 'certificate_download':
      //   return new CertificateDownloadTask(context)
      default:
        return null
    }
  }
}
