import { Field, Float, ID, InputType, Int } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { Allow, IsOptional, ValidateNested } from 'class-validator'

/** Глобальный ValidationPipe (whitelist: true) иначе снимает все поля без class-validator — остаётся {}. */

@InputType({ description: 'Ингредиент в форме рецепта' })
export class IngredientInputModel {
  @Field(() => ID)
  @Allow()
  id!: string

  @Field(() => String)
  @Allow()
  name!: string

  @Field(() => Float, { nullable: true })
  @Allow()
  @IsOptional()
  amount?: number

  @Field(() => String, { nullable: true })
  @Allow()
  @IsOptional()
  unit?: string
}

@InputType({ description: 'КБЖУ во входной форме' })
export class NutritionInputModel {
  @Field(() => Float, { nullable: true })
  @Allow()
  @IsOptional()
  calories?: number

  @Field(() => Float, { nullable: true })
  @Allow()
  @IsOptional()
  protein?: number

  @Field(() => Float, { nullable: true })
  @Allow()
  @IsOptional()
  carbs?: number

  @Field(() => Float, { nullable: true })
  @Allow()
  @IsOptional()
  fat?: number

  @Field(() => Float, { nullable: true })
  @Allow()
  @IsOptional()
  fiber?: number
}

@InputType({ description: 'Данные для создания/обновления рецепта' })
export class RecipeFormInputModel {
  @Field(() => String)
  @Allow()
  title!: string

  @Field(() => Int)
  @Allow()
  cookingTime!: number

  @Field(() => String)
  @Allow()
  difficulty!: string

  @Field(() => String)
  @Allow()
  cuisine!: string

  @Field(() => [String], { nullable: true })
  @Allow()
  @IsOptional()
  tags?: string[]

  @Field(() => String, { nullable: true })
  @Allow()
  @IsOptional()
  coverImage?: string

  @Field(() => [IngredientInputModel])
  @Allow()
  @ValidateNested({ each: true })
  @Type(() => IngredientInputModel)
  ingredients!: IngredientInputModel[]

  @Field(() => [String])
  @Allow()
  instructions!: string[]

  @Field(() => NutritionInputModel, { nullable: true })
  @Allow()
  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionInputModel)
  nutrition?: NutritionInputModel
}
