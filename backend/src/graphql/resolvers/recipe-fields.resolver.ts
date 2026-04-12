import { Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { CommentModel, RatingModel, RecipeModel } from '../types/graphql.models'

@Resolver(() => RecipeModel)
export class RecipeFieldsResolver {
  @ResolveField(() => [RatingModel], { description: 'Оценки рецепта' })
  ratings(@Parent() recipe: RecipeModel) {
    return recipe.ratings ?? []
  }

  @ResolveField(() => [CommentModel], { description: 'Комментарии к рецепту' })
  comments(@Parent() recipe: RecipeModel) {
    return recipe.comments ?? []
  }
}
