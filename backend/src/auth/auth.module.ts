import { DynamicModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'

@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>('JWT_SECRET') ?? 'homecookhub-dev-secret',
            signOptions: { expiresIn: '7d' },
          }),
          inject: [ConfigService],
        }),
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy],
      exports: [AuthService, JwtModule],
    }
  }
}
