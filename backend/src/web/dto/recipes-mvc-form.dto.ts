import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'

export class RecipesMvcFormDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cookingTime!: number

  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty!: string

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  cuisine!: string

  /** Одна строка — первый ингредиент (упрощённая форма ЛР 3). */
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  ingredientName!: string

  @IsString()
  @MinLength(1)
  instructions!: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverImage?: string
}
