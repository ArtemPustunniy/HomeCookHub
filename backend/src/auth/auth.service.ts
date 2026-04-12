import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'

const SALT_ROUNDS = 10

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже зарегистрирован')
    }
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS)
    const user = await this.prisma.user.create({
      data: { name: dto.name.trim(), email: dto.email, password: hashedPassword, role: 'user' },
    })
    const token = this.jwt.sign({ userId: user.id, name: user.name, role: user.role })
    return { token, user: { id: user.id, name: user.name, role: user.role } }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.password) {
      throw new UnauthorizedException('Неверный email или пароль')
    }
    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) {
      throw new UnauthorizedException('Неверный email или пароль')
    }
    const token = this.jwt.sign({ userId: user.id, name: user.name, role: user.role })
    return { token, user: { id: user.id, name: user.name, role: user.role } }
  }
}
