import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { JwtUser } from '../../auth/jwt.strategy'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!roles?.length) return true
    const req = context.switchToHttp().getRequest<{ user?: JwtUser }>()
    const user = req.user
    if (!user) throw new UnauthorizedException()
    const role = user.role ?? 'user'
    if (!roles.includes(role)) throw new ForbiddenException('Insufficient role')
    return true
  }
}
