import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql'

@ObjectType({ description: 'Recipe ingredient' })
export class IngredientModel {
  @Field(() => String, { description: 'Stable id' })
  id!: string

  @Field(() => String, { description: 'Name' })
  name!: string

  @Field(() => Float, { nullable: true, description: 'Amount' })
  amount?: number | null

  @Field(() => String, { nullable: true, description: 'Unit' })
  unit?: string | null
}

@ObjectType({ description: 'Nutrition facts' })
export class NutritionModel {
  @Field(() => Float, { nullable: true })
  calories?: number | null

  @Field(() => Float, { nullable: true })
  protein?: number | null

  @Field(() => Float, { nullable: true })
  carbs?: number | null

  @Field(() => Float, { nullable: true })
  fat?: number | null

  @Field(() => Float, { nullable: true })
  fiber?: number | null
}

@ObjectType({ description: 'User rating for a recipe' })
export class RatingModel {
  @Field(() => ID, { description: 'User id' })
  userId!: string

  @Field(() => Int, { description: '1-5' })
  rating!: number
}

@ObjectType({ description: 'Recipe comment' })
export class CommentModel {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  recipeId!: string

  @Field(() => ID)
  authorId!: string

  @Field(() => String)
  authorName!: string

  @Field(() => String)
  content!: string

  @Field(() => String)
  createdAt!: string

  @Field(() => String, { nullable: true })
  updatedAt?: string | null
}

@ObjectType({ description: 'Recipe' })
export class RecipeModel {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  title!: string

  @Field(() => Int)
  cookingTime!: number

  @Field(() => String)
  difficulty!: string

  @Field(() => String)
  cuisine!: string

  @Field(() => [String])
  tags!: string[]

  @Field(() => String, { nullable: true })
  coverImage?: string | null

  @Field(() => [IngredientModel])
  ingredients!: IngredientModel[]

  @Field(() => [String])
  instructions!: string[]

  @Field(() => NutritionModel, { nullable: true })
  nutrition?: NutritionModel | null

  @Field(() => ID)
  authorId!: string

  @Field(() => String)
  authorName!: string

  @Field(() => Float)
  averageRating!: number

  @Field(() => Int)
  ratingCount!: number

  @Field(() => [RatingModel], { description: 'Ratings (field resolver)' })
  ratings!: RatingModel[]

  @Field(() => [CommentModel], { description: 'Comments (field resolver)' })
  comments!: CommentModel[]

  @Field(() => String)
  createdAt!: string

  @Field(() => String)
  updatedAt!: string
}

@ObjectType({ description: 'Paginated recipe list' })
export class RecipeListModel {
  @Field(() => [RecipeModel])
  items!: RecipeModel[]

  @Field(() => Int)
  total!: number
}

@ObjectType({ description: 'Authenticated user' })
export class UserModel {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  name!: string

  @Field(() => String)
  role!: string
}

@ObjectType({ description: 'Favorites list' })
export class FavoritesModel {
  @Field(() => ID)
  userId!: string

  @Field(() => [ID])
  recipeIds!: string[]
}

@ObjectType({ description: 'Planner day' })
export class PlannerDayModel {
  @Field(() => String)
  date!: string

  @Field(() => [ID])
  recipeIds!: string[]
}

@ObjectType({ description: 'Weekly planner' })
export class PlannerModel {
  @Field(() => String)
  weekStart!: string

  @Field(() => [PlannerDayModel])
  days!: PlannerDayModel[]
}

@ObjectType({ description: 'Shopping list line' })
export class ShoppingListItemModel {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  name!: string

  @Field(() => Float, { nullable: true })
  amount?: number | null

  @Field(() => String, { nullable: true })
  unit?: string | null

  @Field(() => Boolean)
  purchased!: boolean
}

@ObjectType({ description: 'Shopping list' })
export class ShoppingListModel {
  @Field(() => ID)
  id!: string

  @Field(() => [ShoppingListItemModel])
  items!: ShoppingListItemModel[]

  @Field(() => String)
  createdAt!: string

  @Field(() => String)
  updatedAt!: string
}
