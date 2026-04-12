import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import type { Response } from 'express'
import { finalize } from 'rxjs'
import { Observable } from 'rxjs'

@Injectable()
export class ElapsedTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle()
    }
    const started = Date.now()
    const res = context.switchToHttp().getResponse<Response>()
    return next.handle().pipe(
      finalize(() => {
        res.setHeader('X-Elapsed-Time', String(Date.now() - started))
      }),
    )
  }
}
