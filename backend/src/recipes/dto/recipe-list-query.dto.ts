import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class RecipeListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cuisine?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  difficulty?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxTime?: number

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number
}

export function recipeListQueryToRecord(q: RecipeListQueryDto): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  if (q.search != null) out.search = q.search
  if (q.cuisine != null) out.cuisine = q.cuisine
  if (q.difficulty != null) out.difficulty = q.difficulty
  if (q.tag != null) out.tag = q.tag
  if (q.maxTime != null) out.maxTime = String(q.maxTime)
  if (q.page != null) out.page = String(q.page)
  if (q.limit != null) out.limit = String(q.limit)
  return out
}
