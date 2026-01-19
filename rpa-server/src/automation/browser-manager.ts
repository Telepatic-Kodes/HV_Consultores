// HV Consultores - SII RPA Server
// Browser Pool Manager with Anti-Detection

import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { logger } from '../utils/logger'

interface BrowserInstance {
  browser: Browser
  context: BrowserContext
  page: Page
  inUse: boolean
  createdAt: Date
  lastUsed: Date
}

export class BrowserManager {
  private static instance: BrowserManager
  private browsers: Map<string, BrowserInstance> = new Map()
  private maxBrowsers: number
  private browserTimeout: number

  private constructor() {
    this.maxBrowsers = parseInt(process.env.MAX_BROWSERS || '5')
    this.browserTimeout = parseInt(process.env.BROWSER_TIMEOUT_MS || '300000') // 5 minutes
  }

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager()
    }
    return BrowserManager.instance
  }

  async initialize(): Promise<void> {
    logger.info('Initializing browser manager', { maxBrowsers: this.maxBrowsers })

    // Start cleanup interval
    setInterval(() => this.cleanupIdleBrowsers(), 60000) // Every minute
  }

  async acquireBrowser(sessionId: string): Promise<{
    context: BrowserContext
    page: Page
  }> {
    // Check if we have an available browser
    let instance = this.browsers.get(sessionId)

    if (instance && !instance.inUse) {
      instance.inUse = true
      instance.lastUsed = new Date()
      return { context: instance.context, page: instance.page }
    }

    // Check if we can create a new browser
    if (this.browsers.size >= this.maxBrowsers) {
      // Try to reclaim an idle browser
      const idleBrowser = await this.reclaimIdleBrowser()
      if (idleBrowser) {
        this.browsers.delete(idleBrowser)
      } else {
        throw new Error('No browsers available. Max capacity reached.')
      }
    }

    // Create new browser with anti-detection measures
    const browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    })

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'es-CL',
      timezoneId: 'America/Santiago',
      geolocation: { latitude: -33.4489, longitude: -70.6693 }, // Santiago, Chile
      permissions: ['geolocation'],
    })

    // Apply anti-detection scripts
    await this.applyAntiDetection(context)

    const page = await context.newPage()

    instance = {
      browser,
      context,
      page,
      inUse: true,
      createdAt: new Date(),
      lastUsed: new Date(),
    }

    this.browsers.set(sessionId, instance)
    logger.info('Browser acquired', { sessionId, totalBrowsers: this.browsers.size })

    return { context, page }
  }

  async releaseBrowser(sessionId: string): Promise<void> {
    const instance = this.browsers.get(sessionId)
    if (instance) {
      instance.inUse = false
      instance.lastUsed = new Date()
      logger.info('Browser released', { sessionId })
    }
  }

  async closeBrowser(sessionId: string): Promise<void> {
    const instance = this.browsers.get(sessionId)
    if (instance) {
      try {
        await instance.context.close()
        await instance.browser.close()
      } catch (error) {
        logger.error('Error closing browser', { sessionId, error })
      }
      this.browsers.delete(sessionId)
      logger.info('Browser closed', { sessionId })
    }
  }

  async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = []

    for (const [sessionId] of this.browsers) {
      closePromises.push(this.closeBrowser(sessionId))
    }

    await Promise.all(closePromises)
    logger.info('All browsers closed')
  }

  getActiveBrowserCount(): number {
    return this.browsers.size
  }

  getMaxBrowsers(): number {
    return this.maxBrowsers
  }

  private async cleanupIdleBrowsers(): Promise<void> {
    const now = Date.now()

    for (const [sessionId, instance] of this.browsers) {
      if (!instance.inUse) {
        const idleTime = now - instance.lastUsed.getTime()
        if (idleTime > this.browserTimeout) {
          logger.info('Cleaning up idle browser', { sessionId, idleTime })
          await this.closeBrowser(sessionId)
        }
      }
    }
  }

  private async reclaimIdleBrowser(): Promise<string | null> {
    let oldestSession: string | null = null
    let oldestTime = Date.now()

    for (const [sessionId, instance] of this.browsers) {
      if (!instance.inUse && instance.lastUsed.getTime() < oldestTime) {
        oldestTime = instance.lastUsed.getTime()
        oldestSession = sessionId
      }
    }

    return oldestSession
  }

  private async applyAntiDetection(context: BrowserContext): Promise<void> {
    // Add init script to hide automation indicators
    await context.addInitScript(() => {
      // Override webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' },
        ],
      })

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['es-CL', 'es', 'en'],
      })

      // Override permissions query
      const originalQuery = window.navigator.permissions.query
      // @ts-ignore
      window.navigator.permissions.query = (parameters: any) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: 'prompt', onchange: null } as PermissionStatus)
          : originalQuery(parameters)

      // Add Chrome runtime
      // @ts-ignore
      window.chrome = {
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: {},
      }
    })
  }
}
