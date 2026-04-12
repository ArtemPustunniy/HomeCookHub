import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import type { JwtUser } from '../auth/jwt.strategy'
import { RecipesListHttpCacheInterceptor } from '../common/interceptors/recipes-list-cache.interceptor'
import { RecipeListQueryDto, recipeListQueryToRecord } from './dto/recipe-list-query.dto'
import { RecipesService } from './recipes.service'

function buildRecipesLinkUrl(req: Request, query: RecipeListQueryDto, page: number): string {
  const xf = req.headers['x-forwarded-proto']
  const proto = (Array.isArray(xf) ? xf[0] : xf) ?? req.protocol
  const xfh = req.headers['x-forwarded-host']
  const host = (Array.isArray(xfh) ? xfh[0] : xfh) ?? req.get('host')
  const base = `${proto}://${host}`
  const params = new URLSearchParams()
  if (query.search != null) params.set('search', query.search)
  if (query.cuisine != null) params.set('cuisine', query.cuisine)
  if (query.difficulty != null) params.set('difficulty', query.difficulty)
  if (query.tag != null) params.set('tag', query.tag)
  if (query.maxTime != null) params.set('maxTime', String(query.maxTime))
  if (query.limit != null) params.set('limit', String(query.limit))
  params.set('page', String(page))
  const qs = params.toString()
  return qs ? `${base}/recipes?${qs}` : `${base}/recipes?page=${page}`
}

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'Список рецептов (пагинация, Link, кэш)' })
  @ApiResponse({ status: 200, description: 'recipes + total' })
  @UseInterceptors(CacheInterceptor, RecipesListHttpCacheInterceptor)
  @CacheTTL(5000)
  async list(
    @Query() query: RecipeListQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const record = recipeListQueryToRecord(query)
    const data = await this.recipes.list(record)
    const page = Math.max(1, query.page ?? 1)
    const limit = Math.min(50, Math.max(1, query.limit ?? 12))
    const totalPages = Math.max(1, Math.ceil(data.total / limit))
    const links: string[] = []
    if (page < totalPages) {
      links.push(`<${buildRecipesLinkUrl(req, query, page + 1)}>; rel="next"`)
    }
    if (page > 1) {
      links.push(`<${buildRecipesLinkUrl(req, query, page - 1)}>; rel="prev"`)
    }
    if (links.length) {
      res.setHeader('Link', links.join(', '))
    }
    return data
  }

  @Put(':id/rating')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async putRating(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request & { user: JwtUser },
  ) {
    const r = await this.recipes.putRating(id, body, req.user.userId)
    if (typeof r === 'object' && r && 'ok' in r && r.ok === false) {
      throw new BadRequestException({ error: 'Validation failed', details: r.details })
    }
    return r
  }

  @Get(':id/rating')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  getRating(@Param('id') id: string, @Req() req: Request & { user: JwtUser }) {
    return this.recipes.getMyRating(id, req.user.userId)
  }

  @Post(':recipeId/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(201)
  async addComment(
    @Param('recipeId') recipeId: string,
    @Body() body: unknown,
    @Req() req: Request & { user: JwtUser },
  ) {
    const r = await this.recipes.addComment(recipeId, body, req.user.userId, req.user.name)
    if (typeof r === 'object' && r && 'ok' in r && r.ok === false) {
      throw new BadRequestException({ error: 'Validation failed', details: r.details })
    }
    return r
  }

  @Patch(':recipeId/comments/:commentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async patchComment(
    @Param('recipeId') recipeId: string,
    @Param('commentId') commentId: string,
    @Body() body: unknown,
    @Req() req: Request & { user: JwtUser },
  ) {
    const r = await this.recipes.patchComment(recipeId, commentId, body, req.user.userId)
    if (typeof r === 'object' && r && 'ok' in r && r.ok === false) {
      throw new BadRequestException({ error: 'Validation failed', details: r.details })
    }
    return r
  }

  @Delete(':recipeId/comments/:commentId')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async deleteComment(
    @Param('recipeId') recipeId: string,
    @Param('commentId') commentId: string,
    @Req() req: Request & { user: JwtUser },
  ) {
    await this.recipes.deleteComment(recipeId, commentId, req.user.userId)
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(201)
  async create(@Body() body: unknown, @Req() req: Request & { user: JwtUser }) {
    const r = await this.recipes.create(body, req.user.userId, req.user.name)
    if (typeof r === 'object' && r && 'ok' in r && r.ok === false) {
      throw new BadRequestException({ error: 'Validation failed', details: r.details })
    }
    return r
  }

  @Get(':id')
  @ApiOperation({ summary: 'Рецепт по id' })
  getOne(@Param('id') id: string) {
    return this.recipes.getById(id)
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() body: unknown, @Req() req: Request & { user: JwtUser }) {
    const r = await this.recipes.update(id, body, req.user.userId)
    if (typeof r === 'object' && r && 'ok' in r && r.ok === false) {
      throw new BadRequestException({ error: 'Validation failed', details: r.details })
    }
    return r
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Req() req: Request & { user: JwtUser }) {
    await this.recipes.remove(id, req.user.userId)
  }
}
