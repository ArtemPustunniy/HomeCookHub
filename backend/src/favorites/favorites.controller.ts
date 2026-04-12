import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import type { JwtUser } from '../auth/jwt.strategy'
import { FavoritesService } from './favorites.service'

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FavoritesController {
  constructor(private favorites: FavoritesService) {}

  @Get()
  list(@Req() req: Request & { user: JwtUser }) {
    return this.favorites.listRecipeIds(req.user.userId)
  }

  @Post()
  add(@Req() req: Request & { user: JwtUser }, @Body() body: unknown) {
    return this.favorites.add(req.user.userId, body)
  }

  @Delete(':recipeId')
  remove(@Req() req: Request & { user: JwtUser }, @Param('recipeId') recipeId: string) {
    return this.favorites.remove(req.user.userId, recipeId)
  }

  @Get(':recipeId')
  check(@Req() req: Request & { user: JwtUser }, @Param('recipeId') recipeId: string) {
    return this.favorites.isFavorite(req.user.userId, recipeId)
  }
}
