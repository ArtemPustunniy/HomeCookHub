import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { createHash } from 'crypto'
import type { Response } from 'express'
import { map } from 'rxjs'
import { Observable } from 'rxjs'

/** ETag + Cache-Control для клиентского кэша (ЛР 6). */
@Injectable()
export class RecipesListHttpCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle()
    }
    const res = context.switchToHttp().getResponse<Response>()
    return next.handle().pipe(
      map((data) => {
        const body = JSON.stringify(data)
        const etag = `"${createHash('sha1').update(body).digest('hex')}"`
        res.setHeader('ETag', etag)
        res.setHeader('Cache-Control', 'public, max-age=60')
        return data
      }),
    )
  }
}
