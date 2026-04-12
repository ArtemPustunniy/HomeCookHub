import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import type { JwtUser } from '../auth/jwt.strategy'
import { ShoppingListService } from './shopping-list.service'

@ApiTags('shopping-list')
@Controller('shopping-list')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ShoppingListController {
  constructor(private shopping: ShoppingListService) {}

  @Get()
  get(@Req() req: Request & { user: JwtUser }) {
    return this.shopping.get(req.user.userId)
  }

  @Post('generate')
  generate(@Req() req: Request & { user: JwtUser }, @Body() body: unknown) {
    return this.shopping.generate(req.user.userId, body)
  }

  @Post('items')
  @HttpCode(201)
  addItem(@Req() req: Request & { user: JwtUser }, @Body() body: unknown) {
    return this.shopping.addItem(req.user.userId, body)
  }

  @Patch('items/:itemId')
  patchItem(
    @Req() req: Request & { user: JwtUser },
    @Param('itemId') itemId: string,
    @Body() body: unknown,
  ) {
    return this.shopping.patchItem(req.user.userId, itemId, body)
  }

  @Delete('items/:itemId')
  deleteItem(@Req() req: Request & { user: JwtUser }, @Param('itemId') itemId: string) {
    return this.shopping.deleteItem(req.user.userId, itemId)
  }

  @Patch('items/:itemId/toggle-purchased')
  toggle(@Req() req: Request & { user: JwtUser }, @Param('itemId') itemId: string) {
    return this.shopping.togglePurchased(req.user.userId, itemId)
  }

  @Delete()
  clear(@Req() req: Request & { user: JwtUser }) {
    return this.shopping.clear(req.user.userId)
  }
}
