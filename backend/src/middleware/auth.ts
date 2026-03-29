import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthPayload } from '../types.js'
// #region agent log
import { DBG } from '../debugLog.js'
// #endregion

const SECRET = process.env.JWT_SECRET ?? 'homecookhub-dev-secret'

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as AuthPayload
    return decoded
  } catch {
    return null
  }
}

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload
}

/** Requires Authorization: Bearer <token>. Sets req.user. Sends 401 if missing/invalid. */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ error: 'Authorization required' })
    return
  }
  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }
  req.user = payload
  next()
}

/** Optional auth: sets req.user if valid token present, does not 401. */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = getBearerToken(req)
  const payload = token ? verifyToken(token) : null
  if (payload) req.user = payload
  if (req.originalUrl?.includes('graphql')) {
    // #region agent log
    DBG('auth.ts:52', 'optionalAuth graphql', { hasUser: !!req.user, userId: req.user?.userId }, 'H1,H2')
    // #endregion
    console.log('[optionalAuth] url:', req.originalUrl, 'authHeader:', !!req.headers.authorization, 'token:', !!token, 'user:', !!payload, payload ? `userId=${payload.userId}` : '')
  }
  next()
}

/** Requires specific role (e.g. 'admin') */
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authorization required' })
      return
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: 'Insufficient role' })
      return
    }
    next()
  }
}
