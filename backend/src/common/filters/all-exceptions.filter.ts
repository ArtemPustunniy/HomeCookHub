import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      throw exception
    }
    const res = host.switchToHttp().getResponse<Response>()
    const { status, body } = this.mapException(exception)
    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception))
    }
    res.status(status).json(body)
  }

  private mapException(exception: unknown): { status: number; body: Record<string, unknown> } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const msg = exception.getResponse()
      return {
        status,
        body:
          typeof msg === 'object' && msg !== null
            ? (msg as Record<string, unknown>)
            : { error: String(msg) },
      }
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2025') {
      return { status: HttpStatus.NOT_FOUND, body: { error: 'Not found' } }
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: { error: 'Database error', code: exception.code },
      }
    }
    this.logger.error(exception instanceof Error ? exception.stack : String(exception))
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { error: 'Internal server error' },
    }
  }
}
