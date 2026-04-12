import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'crypto'

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly log = new Logger(RequestContextMiddleware.name)

  use(req: Request, res: Response, next: NextFunction) {
    const id = randomUUID()
    ;(req as Request & { requestId?: string }).requestId = id
    res.setHeader('X-Request-Id', id)
    this.log.debug(`${req.method} ${req.originalUrl}`)
    next()
  }
}
