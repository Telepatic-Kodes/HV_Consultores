// HV Consultores - SII RPA Server
// Login Task - Validate SII credentials

import { BaseTask, TaskContext } from './base-task'
import { SII_SELECTORS } from '../selectors/sii-selectors'
import { logger } from '../utils/logger'

export class LoginTask extends BaseTask {
  constructor(context: TaskContext) {
    super(context)
  }

  getTaskName(): string {
    return 'login_test'
  }

  async executeSteps(): Promise<Record<string, unknown>> {
    // Login is already performed in base class
    // Just verify and return user info

    this.currentStep = 'extract_user_info'

    // Try to extract user information
    let userName: string | null = null
    let razonSocial: string | null = null

    try {
      // Wait for user menu or name element
      const userNameElement = await this.page.$(SII_SELECTORS.LOGIN.LOGGED_IN_INDICATOR)

      if (userNameElement) {
        userName = await userNameElement.textContent()
      }

      // Try to get business name from page
      const titleElement = await this.page.$('h1, .titulo-contribuyente')
      if (titleElement) {
        razonSocial = await titleElement.textContent()
      }
    } catch (error) {
      logger.warn('Could not extract user info', {
        jobId: this.context.jobId,
        error,
      })
    }

    await this.takeScreenshot('login_verified')

    return {
      valid: true,
      auth_method: this.context.credentials.authMethod,
      rut: this.context.credentials.rut,
      user_name: userName?.trim() || null,
      razon_social: razonSocial?.trim() || null,
      login_timestamp: new Date().toISOString(),
    }
  }
}
