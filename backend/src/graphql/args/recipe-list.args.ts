import { ArgsType, Field, Int } from '@nestjs/graphql'

@ArgsType()
export class RecipeListArgs {
  @Field({ nullable: true, description: 'Поиск по названию' })
  search?: string

  @Field({ nullable: true, description: 'Фильтр по кухне' })
  cuisine?: string

  @Field({ nullable: true, description: 'Сложность' })
  difficulty?: string

  @Field({ nullable: true, description: 'Тег' })
  tag?: string

  @Field(() => Int, { nullable: true, description: 'Макс. время приготовления' })
  maxTime?: number

  @Field(() => Int, { nullable: true, description: 'Номер страницы' })
  page?: number

  @Field(() => Int, { nullable: true, description: 'Размер страницы' })
  limit?: number
}
