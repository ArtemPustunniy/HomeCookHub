import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import type { JwtUser } from '../auth/jwt.strategy'
import { PlannerService } from './planner.service'

@ApiTags('planner')
@Controller('planner')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PlannerController {
  constructor(private planner: PlannerService) {}

  @Get()
  get(@Req() req: Request & { user: JwtUser }, @Query('weekStart') weekStart?: string) {
    return this.planner.get(req.user.userId, weekStart)
  }

  @Post('days/:dayIndex/recipes')
  addRecipe(
    @Req() req: Request & { user: JwtUser },
    @Param('dayIndex') dayIndex: string,
    @Body() body: unknown,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.planner.addRecipe(req.user.userId, parseInt(dayIndex, 10), body, weekStart)
  }

  @Delete('days/:dayIndex/recipes/:recipeId')
  removeRecipe(
    @Req() req: Request & { user: JwtUser },
    @Param('dayIndex') dayIndex: string,
    @Param('recipeId') recipeId: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.planner.removeRecipe(req.user.userId, parseInt(dayIndex, 10), recipeId, weekStart)
  }

  @Patch('recipes/:recipeId/move')
  move(
    @Req() req: Request & { user: JwtUser },
    @Param('recipeId') recipeId: string,
    @Body() body: unknown,
  ) {
    return this.planner.moveRecipe(req.user.userId, recipeId, body)
  }

  @Delete('days/:dayIndex')
  clearDay(
    @Req() req: Request & { user: JwtUser },
    @Param('dayIndex') dayIndex: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.planner.clearDay(req.user.userId, parseInt(dayIndex, 10), weekStart)
  }

  @Delete('week')
  clearWeek(@Req() req: Request & { user: JwtUser }, @Query('weekStart') weekStart?: string) {
    return this.planner.clearWeek(req.user.userId, weekStart)
  }
}
