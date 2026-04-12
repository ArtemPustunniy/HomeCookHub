import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import type { JwtUser } from './jwt.strategy'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Регистрация' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Токен и пользователь' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 409, description: 'Email занят' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Токен и пользователь' })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Текущий пользователь' })
  @ApiResponse({ status: 401, description: 'Нет или невалидный Bearer' })
  me(@Req() req: Request & { user: JwtUser }) {
    const u = req.user
    return { id: u.userId, name: u.name, role: u.role }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Выход (клиент удаляет токен)' })
  logout() {
    return { message: 'Logged out' }
  }
}
