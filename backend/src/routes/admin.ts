import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

// Пример административного эндпоинта: список пользователей с их ролями
router.get(
  '/users',
  requireAuth,
  requireRole('admin'),
  async (_req: AuthenticatedRequest, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      })),
    )
  },
)

export default router

