import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import type { JwtUser } from '../auth/jwt.strategy'
import { BffService } from './bff.service'

@ApiTags('bff')
@Controller('bff')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BffController {
  constructor(private bff: BffService) {}

  @Get('home')
  @ApiOperation({ summary: 'Агрегированные данные для главной' })
  home(@Req() req: Request & { user: JwtUser }) {
    return this.bff.home(req.user)
  }
}
