import { Args, Context, Float, ID, Int, Mutation, Resolver } from '@nestjs/graphql'
import type { GraphQLContext } from '../graphql-operations.service'
import { GraphqlOperationsService } from '../graphql-operations.service'
import { RecipeFormInputModel } from '../types/graphql.inputs'
import {
  CommentModel,
  FavoritesModel,
  PlannerModel,
  RecipeModel,
  ShoppingListModel,
} from '../types/graphql.models'
import type { GqlRequestContext } from './graphql-query.resolver'

@Resolver()
export class GraphqlMutationResolver {
  constructor(private readonly ops: GraphqlOperationsService) {}

  private ctx(c: GqlRequestContext): GraphQLContext {
    return { user: c.user }
  }

  @Mutation(() => RecipeModel)
  createRecipe(@Args('input', { type: () => RecipeFormInputModel }) input: RecipeFormInputModel, @Context() c: GqlRequestContext) {
    return this.ops.createRecipe({ input }, this.ctx(c))
  }

  @Mutation(() => RecipeModel)
  updateRecipe(
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => RecipeFormInputModel }) input: RecipeFormInputModel,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.updateRecipe({ id, input }, this.ctx(c))
  }

  @Mutation(() => Boolean)
  deleteRecipe(@Args('id', { type: () => ID }) id: string, @Context() c: GqlRequestContext) {
    return this.ops.deleteRecipe({ id }, this.ctx(c))
  }

  @Mutation(() => CommentModel)
  addComment(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('content', { type: () => String }) content: string,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.addComment({ recipeId, content }, this.ctx(c))
  }

  @Mutation(() => CommentModel)
  updateComment(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('commentId', { type: () => ID }) commentId: string,
    @Args('content', { type: () => String }) content: string,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.updateComment({ recipeId, commentId, content }, this.ctx(c))
  }

  @Mutation(() => Boolean)
  deleteComment(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('commentId', { type: () => ID }) commentId: string,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.deleteComment({ recipeId, commentId }, this.ctx(c))
  }

  @Mutation(() => RecipeModel)
  setRating(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('rating', { type: () => Int }) rating: number,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.setRating({ recipeId, rating }, this.ctx(c))
  }

  @Mutation(() => PlannerModel)
  addRecipeToPlanner(
    @Args('weekStart', { type: () => String, nullable: true }) weekStart: string | null,
    @Args('dayIndex', { type: () => Int }) dayIndex: number,
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.addRecipeToPlanner({ weekStart, dayIndex, recipeId }, this.ctx(c))
  }

  @Mutation(() => PlannerModel)
  removeRecipeFromPlanner(
    @Args('weekStart', { type: () => String, nullable: true }) weekStart: string | null,
    @Args('dayIndex', { type: () => Int }) dayIndex: number,
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.removeRecipeFromPlanner({ weekStart, dayIndex, recipeId }, this.ctx(c))
  }

  @Mutation(() => PlannerModel)
  moveRecipeInPlanner(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('weekStart', { type: () => String }) weekStart: string,
    @Args('fromDayIndex', { type: () => Int }) fromDayIndex: number,
    @Args('toDayIndex', { type: () => Int }) toDayIndex: number,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.moveRecipeInPlanner({ recipeId, weekStart, fromDayIndex, toDayIndex }, this.ctx(c))
  }

  @Mutation(() => PlannerModel)
  clearPlannerDay(
    @Args('weekStart', { type: () => String, nullable: true }) weekStart: string | null,
    @Args('dayIndex', { type: () => Int }) dayIndex: number,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.clearPlannerDay({ weekStart, dayIndex }, this.ctx(c))
  }

  @Mutation(() => PlannerModel)
  clearPlannerWeek(
    @Args('weekStart', { type: () => String, nullable: true }) weekStart: string | null,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.clearPlannerWeek({ weekStart }, this.ctx(c))
  }

  @Mutation(() => ShoppingListModel)
  generateShoppingList(@Args('recipeIds', { type: () => [ID] }) recipeIds: string[], @Context() c: GqlRequestContext) {
    return this.ops.generateShoppingList({ recipeIds }, this.ctx(c))
  }

  @Mutation(() => ShoppingListModel)
  addShoppingListItem(
    @Args('name', { type: () => String }) name: string,
    @Args('amount', { type: () => Float, nullable: true }) amount: number | null,
    @Args('unit', { type: () => String, nullable: true }) unit: string | null,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.addShoppingListItem({ name, amount, unit }, this.ctx(c))
  }

  @Mutation(() => ShoppingListModel)
  updateShoppingListItem(
    @Args('itemId', { type: () => ID }) itemId: string,
    @Args('name', { type: () => String, nullable: true }) name: string | null,
    @Args('amount', { type: () => Float, nullable: true }) amount: number | null,
    @Args('unit', { type: () => String, nullable: true }) unit: string | null,
    @Args('purchased', { type: () => Boolean, nullable: true }) purchased: boolean | null,
    @Context() c: GqlRequestContext,
  ) {
    return this.ops.updateShoppingListItem({ itemId, name, amount, unit, purchased }, this.ctx(c))
  }

  @Mutation(() => ShoppingListModel)
  deleteShoppingListItem(@Args('itemId', { type: () => ID }) itemId: string, @Context() c: GqlRequestContext) {
    return this.ops.deleteShoppingListItem({ itemId }, this.ctx(c))
  }

  @Mutation(() => ShoppingListModel)
  toggleShoppingListItemPurchased(@Args('itemId', { type: () => ID }) itemId: string, @Context() c: GqlRequestContext) {
    return this.ops.toggleShoppingListItemPurchased({ itemId }, this.ctx(c))
  }

  @Mutation(() => ShoppingListModel)
  clearShoppingList(@Context() c: GqlRequestContext) {
    return this.ops.clearShoppingList({}, this.ctx(c))
  }

  @Mutation(() => FavoritesModel)
  addFavorite(@Args('recipeId', { type: () => ID }) recipeId: string, @Context() c: GqlRequestContext) {
    return this.ops.addFavorite({ recipeId }, this.ctx(c))
  }

  @Mutation(() => FavoritesModel)
  removeFavorite(@Args('recipeId', { type: () => ID }) recipeId: string, @Context() c: GqlRequestContext) {
    return this.ops.removeFavorite({ recipeId }, this.ctx(c))
  }
}
