import { Args, Context, ID, Int, Query, Resolver } from '@nestjs/graphql'
import { RecipeListArgs } from '../args/recipe-list.args'
import type { GraphQLContext } from '../graphql-operations.service'
import { GraphqlOperationsService } from '../graphql-operations.service'
import {
  FavoritesModel,
  PlannerModel,
  RecipeListModel,
  RecipeModel,
  ShoppingListModel,
  UserModel,
} from '../types/graphql.models'

export interface GqlRequestContext {
  user: GraphQLContext['user']
  req?: unknown
}

@Resolver()
export class GraphqlQueryResolver {
  constructor(private readonly ops: GraphqlOperationsService) {}

  private ctx(c: GqlRequestContext): GraphQLContext {
    return { user: c.user }
  }

  @Query(() => RecipeListModel, { description: 'Paginated recipe list' })
  recipes(@Args() args: RecipeListArgs) {
    return this.ops.recipes(args)
  }

  @Query(() => RecipeModel, { nullable: true, description: 'Single recipe' })
  recipe(@Args('id', { type: () => ID }) id: string) {
    return this.ops.recipe({ id })
  }

  @Query(() => Int, { description: 'Current user rating for recipe' })
  recipeRating(@Args('recipeId', { type: () => ID }) recipeId: string, @Context() c: GqlRequestContext) {
    return this.ops.recipeRating({ recipeId }, this.ctx(c))
  }

  @Query(() => UserModel, { nullable: true, description: 'Current user' })
  me(@Context() c: GqlRequestContext) {
    return this.ops.me({}, this.ctx(c))
  }

  @Query(() => FavoritesModel, { description: 'User favorites' })
  favorites(@Context() c: GqlRequestContext) {
    return this.ops.favorites({}, this.ctx(c))
  }

  @Query(() => PlannerModel, { description: 'Weekly planner' })
  planner(@Args('weekStart', { type: () => String, nullable: true }) weekStart: string | null, @Context() c: GqlRequestContext) {
    return this.ops.planner({ weekStart }, this.ctx(c))
  }

  @Query(() => ShoppingListModel, { description: 'Shopping list' })
  shoppingList(@Context() c: GqlRequestContext) {
    return this.ops.shoppingList({}, this.ctx(c))
  }

  @Query(() => Boolean, { description: 'Is recipe in favorites' })
  isFavorite(@Args('recipeId', { type: () => ID }) recipeId: string, @Context() c: GqlRequestContext) {
    return this.ops.isFavorite({ recipeId }, this.ctx(c))
  }
}
