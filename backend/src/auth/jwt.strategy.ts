import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

export interface JwtUser {
  userId: string
  name: string
  role?: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'homecookhub-dev-secret',
    })
  }

  validate(payload: { userId: string; name: string; role?: string }): JwtUser {
    return { userId: payload.userId, name: payload.name, role: payload.role }
  }
}
