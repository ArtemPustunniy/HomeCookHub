import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { Roles } from '../common/decorators/roles.decorator'
import { RolesGuard } from '../common/guards/roles.guard'
import { AdminService } from './admin.service'

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список пользователей (admin)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  users() {
    return this.admin.listUsers()
  }
}
