import { Injectable } from '@nestjs/common'
import type { MessageEvent } from '@nestjs/common'
import { Observable, Subject, merge, interval } from 'rxjs'
import { map } from 'rxjs/operators'

export type RecipeCollectionSsePayload =
  | { type: 'recipe.created'; id: string }
  | { type: 'recipe.updated'; id: string }
  | { type: 'recipe.deleted'; id: string }
  | { type: 'ping' }

@Injectable()
export class RecipesCollectionEventsService {
  private readonly subject = new Subject<RecipeCollectionSsePayload>()

  emit(event: RecipeCollectionSsePayload): void {
    if (event.type !== 'ping') {
      this.subject.next(event)
    }
  }

  /** Поток для @Sse(): события коллекции + редкий ping (keep-alive). */
  sseStream(): Observable<MessageEvent> {
    const events = this.subject.asObservable().pipe(
      map((payload) => ({ data: JSON.stringify(payload) }) as MessageEvent),
    )
    const heartbeats = interval(25000).pipe(
      map(() => ({ data: JSON.stringify({ type: 'ping' } satisfies RecipeCollectionSsePayload) }) as MessageEvent),
    )
    return merge(events, heartbeats)
  }
}
