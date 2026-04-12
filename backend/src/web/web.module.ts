import { Module } from '@nestjs/common'
import { RecipesModule } from '../recipes/recipes.module'
import { RecipesMvcController } from './recipes-mvc.controller'
import { RecipesMvcService } from './recipes-mvc.service'

@Module({
  imports: [RecipesModule],
  controllers: [RecipesMvcController],
  providers: [RecipesMvcService],
})
export class WebModule {}
