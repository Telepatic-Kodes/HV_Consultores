// HV Consultores - SII RPA Server
// API Key Authentication Middleware

import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string
  const expectedApiKey = process.env.API_KEY

  if (!expectedApiKey) {
    logger.error('API_KEY not configured - rejecting request')
    res.status(500).json({
      success: false,
      error: 'Server misconfiguration: API key not set',
    })
    return
  }

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'Missing API key',
    })
    return
  }

  if (apiKey !== expectedApiKey) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      path: req.path,
    })

    res.status(403).json({
      success: false,
      error: 'Invalid API key',
    })
    return
  }

  next()
}
