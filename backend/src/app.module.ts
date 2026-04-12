import { CacheModule } from '@nestjs/cache-manager'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AdminModule } from './admin/admin.module'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { BffModule } from './bff/bff.module'
import { RequestContextMiddleware } from './common/middleware/request-context.middleware'
import { FavoritesModule } from './favorites/favorites.module'
import { GraphqlModule } from './graphql/graphql.module'
import { PlannerModule } from './planner/planner.module'
import { PrismaModule } from './prisma/prisma.module'
import { RecipesEventsModule } from './recipes-events/recipes-events.module'
import { RecipesModule } from './recipes/recipes.module'
import { ShoppingListModule } from './shopping-list/shopping-list.module'
import { StorageModule } from './storage/storage.module'
import { WebModule } from './web/web.module'

@Module({
  imports: [
    CacheModule.register({ isGlobal: true, ttl: 5000, max: 200 }),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RecipesEventsModule,
    AuthModule.forRoot(),
    GraphqlModule,
    StorageModule,
    RecipesModule,
    WebModule,
    PlannerModule,
    ShoppingListModule,
    FavoritesModule,
    BffModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*')
  }
}
