import { Router } from 'express'
import { z } from 'zod'
import type { Comment as DbComment, Prisma, Rating, Recipe } from '@prisma/client'
import { prisma } from '../db.js'
import {
  RecipeFormSchema,
  type Recipe as ApiRecipe,
  type Comment as ApiComment,
} from '../types.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

type RecipeDbInput = Recipe & {
  comments?: DbComment[]
  ratings?: Rating[]
}

function toApiRecipe(db: RecipeDbInput): ApiRecipe {
  return {
    id: db.id,
    title: db.title,
    cookingTime: db.cookingTime,
    difficulty: db.difficulty as ApiRecipe['difficulty'],
    cuisine: db.cuisine,
    tags: (db.tags ?? []) as ApiRecipe['tags'],
    coverImage: db.coverImage ?? '',
    ingredients: (db.ingredients as ApiRecipe['ingredients']) ?? [],
    instructions: db.instructions ?? [],
    nutrition: (db.nutrition as ApiRecipe['nutrition']) ?? undefined,
    authorId: db.authorId,
    authorName: db.authorName,
    averageRating: db.averageRating ?? 0,
    ratingCount: db.ratingCount ?? 0,
    ratings: (db.ratings ?? []).map((r: Rating) => ({
      userId: r.userId,
      rating: r.rating,
    })),
    comments: (db.comments ?? []).map((c: DbComment) => ({
      id: c.id,
      recipeId: c.recipeId,
      authorId: c.authorId,
      authorName: c.authorName,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : undefined,
    })),
    createdAt: db.createdAt.toISOString(),
    updatedAt: db.updatedAt.toISOString(),
  }
}

// GET /recipes
router.get('/', async (req, res) => {
  const search = req.query.search as string | undefined
  const cuisine = req.query.cuisine as string | undefined
  const difficulty = req.query.difficulty as string | undefined
  const tag = req.query.tag as string | undefined
  const maxTime = req.query.maxTime != null ? Number(req.query.maxTime) : undefined
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12))

  const where: Prisma.RecipeWhereInput = {}
  if (search) {
    where.title = { contains: search, mode: 'insensitive' }
  }
  if (cuisine) {
    where.cuisine = cuisine
  }
  if (difficulty) {
    where.difficulty = difficulty
  }
  if (tag) {
    where.tags = { has: tag }
  }
  if (maxTime != null) {
    where.cookingTime = { lte: maxTime }
  }

  const [total, items] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const recipes = items.map((r) => toApiRecipe({ ...r, ratings: [], comments: [] }))

  res.json({ recipes, total })
})

// GET /recipes/:id
router.get('/:id', async (req, res) => {
  const recipe = await prisma.recipe.findUnique({
    where: { id: req.params.id },
    include: { comments: true, ratings: true },
  })
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' })
    return
  }
  res.json(toApiRecipe(recipe))
})

// POST /recipes — require auth
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = RecipeFormSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }
  const data = parsed.data

  const created = await prisma.recipe.create({
    data: {
      title: data.title,
      cookingTime: data.cookingTime,
      difficulty: data.difficulty,
      cuisine: data.cuisine,
      tags: data.tags ?? [],
      coverImage: data.coverImage && data.coverImage.length > 0 ? data.coverImage : null,
      ingredients: data.ingredients,
      instructions: data.instructions,
      nutrition: data.nutrition ?? undefined,
      authorId: req.user!.userId,
      authorName: req.user!.name,
    },
  })

  const withRelations = await prisma.recipe.findUnique({
    where: { id: created.id },
    include: { comments: true, ratings: true },
  })

  res.status(201).json(toApiRecipe(withRelations!))
})

// PUT /recipes/:id — only author
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const existing = await prisma.recipe.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ error: 'Recipe not found' })
    return
  }
  if (existing.authorId !== req.user!.userId) {
    res.status(403).json({ error: 'Only the author can update this recipe' })
    return
  }

  const parsed = RecipeFormSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }
  const data = parsed.data

  await prisma.recipe.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      cookingTime: data.cookingTime,
      difficulty: data.difficulty,
      cuisine: data.cuisine,
      tags: data.tags ?? [],
      coverImage: data.coverImage && data.coverImage.length > 0 ? data.coverImage : null,
      ingredients: data.ingredients,
      instructions: data.instructions,
      nutrition: data.nutrition ?? undefined,
    },
  })

  const updated = await prisma.recipe.findUnique({
    where: { id: existing.id },
    include: { comments: true, ratings: true },
  })
  res.json(toApiRecipe(updated!))
})

// DELETE /recipes/:id — only author
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const existing = await prisma.recipe.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ error: 'Recipe not found' })
    return
  }
  if (existing.authorId !== req.user!.userId) {
    res.status(403).json({ error: 'Only the author can delete this recipe' })
    return
  }

  await prisma.recipe.delete({ where: { id: existing.id } })
  res.status(204).send()
})

// ——— Comments ———
const CommentContentBody = z.object({ content: z.string().min(1) })

// POST /recipes/:recipeId/comments
router.post('/:recipeId/comments', requireAuth, async (req: AuthenticatedRequest, res) => {
  const recipe = await prisma.recipe.findUnique({ where: { id: req.params.recipeId } })
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' })
    return
  }
  const parsed = CommentContentBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }

  const created = await prisma.comment.create({
    data: {
      recipeId: recipe.id,
      authorId: req.user!.userId,
      authorName: req.user!.name,
      content: parsed.data.content,
    },
  })

  const apiComment: ApiComment = {
    id: created.id,
    recipeId: created.recipeId,
    authorId: created.authorId,
    authorName: created.authorName,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt ? created.updatedAt.toISOString() : undefined,
  }

  res.status(201).json(apiComment)
})

// PATCH /recipes/:recipeId/comments/:commentId
router.patch(
  '/:recipeId/comments/:commentId',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } })
    if (!comment || comment.recipeId !== req.params.recipeId) {
      res.status(404).json({ error: 'Comment not found' })
      return
    }
    if (comment.authorId !== req.user!.userId) {
      res.status(403).json({ error: 'Only the author can update this comment' })
      return
    }

    const parsed = CommentContentBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
      return
    }

    const updated = await prisma.comment.update({
      where: { id: comment.id },
      data: { content: parsed.data.content },
    })

    const apiComment: ApiComment = {
      id: updated.id,
      recipeId: updated.recipeId,
      authorId: updated.authorId,
      authorName: updated.authorName,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : undefined,
    }

    res.json(apiComment)
  },
)

// DELETE /recipes/:recipeId/comments/:commentId
router.delete(
  '/:recipeId/comments/:commentId',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } })
    if (!comment || comment.recipeId !== req.params.recipeId) {
      res.status(404).json({ error: 'Comment not found' })
      return
    }
    if (comment.authorId !== req.user!.userId) {
      res.status(403).json({ error: 'Only the author can delete this comment' })
      return
    }

    await prisma.comment.delete({ where: { id: comment.id } })
    res.status(204).send()
  },
)

// ——— Rating ———
const RatingBody = z.object({ rating: z.number().min(1).max(5) })

// PUT /recipes/:id/rating
router.put('/:id/rating', requireAuth, async (req: AuthenticatedRequest, res) => {
  const recipe = await prisma.recipe.findUnique({ where: { id: req.params.id } })
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' })
    return
  }

  const parsed = RatingBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }
  const ratingValue = parsed.data.rating
  const userId = req.user!.userId

  await prisma.rating.upsert({
    where: {
      recipeId_userId: {
        recipeId: recipe.id,
        userId,
      },
    },
    create: {
      recipeId: recipe.id,
      userId,
      rating: ratingValue,
    },
    update: {
      rating: ratingValue,
    },
  })

  const allRatings = await prisma.rating.findMany({
    where: { recipeId: recipe.id },
  })
  const ratingCount = allRatings.length
  const averageRating =
    ratingCount === 0
      ? 0
      : allRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount

  await prisma.recipe.update({
    where: { id: recipe.id },
    data: {
      averageRating,
      ratingCount,
    },
  })

  const updated = await prisma.recipe.findUnique({
    where: { id: recipe.id },
    include: { ratings: true, comments: true },
  })

  res.json(toApiRecipe(updated!))
})

// GET /recipes/:id/rating
router.get('/:id/rating', requireAuth, async (req: AuthenticatedRequest, res) => {
  const recipe = await prisma.recipe.findUnique({ where: { id: req.params.id } })
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' })
    return
  }

  const r = await prisma.rating.findUnique({
    where: {
      recipeId_userId: {
        recipeId: recipe.id,
        userId: req.user!.userId,
      },
    },
  })

  res.json({ rating: r ? r.rating : null })
})

export default router

