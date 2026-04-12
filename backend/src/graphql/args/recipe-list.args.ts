import { ArgsType, Field, Int } from '@nestjs/graphql'
import { Allow, IsOptional } from 'class-validator'

/** Глобальный ValidationPipe (whitelist: true) снимает поля без class-validator — фильтры recipes не доходили до сервиса. */

@ArgsType()
export class RecipeListArgs {
  @Field({ nullable: true, description: 'Поиск по названию' })
  @Allow()
  @IsOptional()
  search?: string

  @Field({ nullable: true, description: 'Фильтр по кухне' })
  @Allow()
  @IsOptional()
  cuisine?: string

  @Field({ nullable: true, description: 'Сложность' })
  @Allow()
  @IsOptional()
  difficulty?: string

  @Field({ nullable: true, description: 'Тег' })
  @Allow()
  @IsOptional()
  tag?: string

  @Field(() => Int, { nullable: true, description: 'Макс. время приготовления' })
  @Allow()
  @IsOptional()
  maxTime?: number

  @Field(() => Int, { nullable: true, description: 'Номер страницы' })
  @Allow()
  @IsOptional()
  page?: number

  @Field(() => Int, { nullable: true, description: 'Размер страницы' })
  @Allow()
  @IsOptional()
  limit?: number
}
