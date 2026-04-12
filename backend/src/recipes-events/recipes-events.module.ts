import { Global, Module } from '@nestjs/common'
import { RecipesCollectionEventsService } from './recipes-collection-events.service'

@Global()
@Module({
  providers: [RecipesCollectionEventsService],
  exports: [RecipesCollectionEventsService],
})
export class RecipesEventsModule {}
