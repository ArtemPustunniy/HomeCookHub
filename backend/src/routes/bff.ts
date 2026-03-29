import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

// GET /bff/home — агрегированный ответ для главного экрана
router.get('/home', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId

  const [latestRecipes, favorites, planner] = await Promise.all([
    prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    prisma.favorites.findUnique({ where: { userId } }),
    prisma.planner.findFirst({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      include: { days: { orderBy: { dayIndex: 'asc' } } },
    }),
  ])

  res.json({
    user: {
      id: req.user!.userId,
      name: req.user!.name,
      role: req.user!.role ?? 'user',
    },
    latestRecipes: latestRecipes.map((r) => ({
      id: r.id,
      title: r.title,
      cookingTime: r.cookingTime,
      difficulty: r.difficulty,
      cuisine: r.cuisine,
      tags: r.tags ?? [],
      coverImage: r.coverImage ?? '',
      authorId: r.authorId,
      authorName: r.authorName,
      averageRating: r.averageRating ?? 0,
      ratingCount: r.ratingCount ?? 0,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    favorites: {
      recipeIds: favorites?.recipeIds ?? [],
    },
    planner: planner
      ? {
          weekStart: planner.weekStart,
          days: planner.days.map((d) => ({
            date: d.date,
            recipeIds: d.recipeIds,
          })),
        }
      : null,
  })
})

export default router

