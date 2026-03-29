import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

const AddBody = z.object({ recipeId: z.string().min(1) })

async function getOrCreateFavorites(userId: string) {
  let fav = await prisma.favorites.findUnique({ where: { userId } })
  if (!fav) {
    fav = await prisma.favorites.create({
      data: {
        userId,
        recipeIds: [],
      },
    })
  }
  return fav
}

// GET /favorites
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const fav = await getOrCreateFavorites(req.user!.userId)
  res.json({ recipeIds: fav.recipeIds })
})

// POST /favorites
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = AddBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }

  const fav = await getOrCreateFavorites(req.user!.userId)
  const recipeId = parsed.data.recipeId

  const recipeIds = fav.recipeIds.includes(recipeId)
    ? fav.recipeIds
    : [...fav.recipeIds, recipeId]

  const updated = await prisma.favorites.update({
    where: { userId: fav.userId },
    data: { recipeIds },
  })

  res.json(updated)
})

// DELETE /favorites/:recipeId
router.delete('/:recipeId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const fav = await getOrCreateFavorites(req.user!.userId)
  const recipeId = req.params.recipeId

  const recipeIds = fav.recipeIds.filter((id) => id !== recipeId)
  const updated = await prisma.favorites.update({
    where: { userId: fav.userId },
    data: { recipeIds },
  })

  res.json(updated)
})

// GET /favorites/:recipeId
router.get('/:recipeId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const fav = await getOrCreateFavorites(req.user!.userId)
  const isFavorite = fav.recipeIds.includes(req.params.recipeId)
  res.json({ isFavorite })
})

export default router

