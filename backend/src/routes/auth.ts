import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { signToken } from '../middleware/auth.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { prisma } from '../db.js'

const router = Router()
const SALT_ROUNDS = 10

const RegisterBody = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
})

const LoginBody = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

// POST /auth/register
router.post('/register', async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }
  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' })
    return
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'user',
    },
  })
  const token = signToken({ userId: user.id, name: user.name, role: user.role })
  res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role } })
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const parsed = LoginBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) {
    res.status(401).json({ error: 'Неверный email или пароль' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ error: 'Неверный email или пароль' })
    return
  }

  const token = signToken({ userId: user.id, name: user.name, role: user.role })
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } })
})

// GET /auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) return
  res.json({ id: req.user.userId, name: req.user.name, role: req.user.role })
})

// POST /auth/logout — stateless JWT: client discards token
router.post('/logout', (_req, res) => {
  res.status(200).json({ message: 'Logged out' })
})

export default router
