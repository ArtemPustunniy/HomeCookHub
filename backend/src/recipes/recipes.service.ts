import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Comment as DbComment, Prisma, Rating, Recipe } from '@prisma/client'
import { z } from 'zod'
import { PrismaService } from '../prisma/prisma.service'
import { RecipesCollectionEventsService } from '../recipes-events/recipes-collection-events.service'
import {
  RecipeFormSchema,
  type Recipe as ApiRecipe,
  type Comment as ApiComment,
} from '../types'

type RecipeDbInput = Recipe & {
  comments?: DbComment[]
  ratings?: Rating[]
}

const CommentContentBody = z.object({ content: z.string().min(1) })
const RatingBody = z.object({ rating: z.number().min(1).max(5) })

@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private readonly recipeCollectionEvents: RecipesCollectionEventsService,
  ) {}

  toApiRecipe(db: RecipeDbInput): ApiRecipe {
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

  async list(query: Record<string, string | undefined>) {
    const search = query.search
    const cuisine = query.cuisine
    const difficulty = query.difficulty
    const tag = query.tag
    const maxTime = query.maxTime != null ? Number(query.maxTime) : undefined
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12))

    const where: Prisma.RecipeWhereInput = {}
    if (search) where.title = { contains: search, mode: 'insensitive' }
    if (cuisine) where.cuisine = cuisine
    if (difficulty) where.difficulty = difficulty
    if (tag) where.tags = { has: tag }
    if (maxTime != null) where.cookingTime = { lte: maxTime }

    const [total, items] = await Promise.all([
      this.prisma.recipe.count({ where }),
      this.prisma.recipe.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const recipes = items.map((r) => this.toApiRecipe({ ...r, ratings: [], comments: [] }))
    return { recipes, total }
  }

  async getById(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: { comments: true, ratings: true },
    })
    if (!recipe) throw new NotFoundException({ error: 'Recipe not found' })
    return this.toApiRecipe(recipe)
  }

  async create(body: unknown, userId: string, userName: string) {
    const parsed = RecipeFormSchema.safeParse(body)
    if (!parsed.success) {
      return { ok: false as const, details: parsed.error.flatten() }
    }
    const data = parsed.data
    const created = await this.prisma.recipe.create({
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
        authorId: userId,
        authorName: userName,
      },
    })
    const withRelations = await this.prisma.recipe.findUnique({
      where: { id: created.id },
      include: { comments: true, ratings: true },
    })
    this.recipeCollectionEvents.emit({ type: 'recipe.created', id: created.id })
    return this.toApiRecipe(withRelations!)
  }

  async update(id: string, body: unknown, userId: string) {
    const existing = await this.prisma.recipe.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException({ error: 'Recipe not found' })
    if (existing.authorId !== userId) throw new ForbiddenException({ error: 'Only the author can update this recipe' })
    const parsed = RecipeFormSchema.safeParse(body)
    if (!parsed.success) {
      return { ok: false as const, details: parsed.error.flatten() }
    }
    const data = parsed.data
    await this.prisma.recipe.update({
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
    const updated = await this.prisma.recipe.findUnique({
      where: { id: existing.id },
      include: { comments: true, ratings: true },
    })
    this.recipeCollectionEvents.emit({ type: 'recipe.updated', id: existing.id })
    return this.toApiRecipe(updated!)
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.recipe.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException({ error: 'Recipe not found' })
    if (existing.authorId !== userId) throw new ForbiddenException({ error: 'Only the author can delete this recipe' })
    await this.prisma.recipe.delete({ where: { id: existing.id } })
    this.recipeCollectionEvents.emit({ type: 'recipe.deleted', id: existing.id })
  }

  async addComment(recipeId: string, body: unknown, userId: string, userName: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) throw new NotFoundException({ error: 'Recipe not found' })
    const parsed = CommentContentBody.safeParse(body)
    if (!parsed.success) {
      return { ok: false as const, details: parsed.error.flatten() }
    }
    const created = await this.prisma.comment.create({
      data: {
        recipeId: recipe.id,
        authorId: userId,
        authorName: userName,
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
    return apiComment
  }

  async patchComment(recipeId: string, commentId: string, body: unknown, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment || comment.recipeId !== recipeId) throw new NotFoundException({ error: 'Comment not found' })
    if (comment.authorId !== userId) throw new ForbiddenException({ error: 'Only the author can update this comment' })
    const parsed = CommentContentBody.safeParse(body)
    if (!parsed.success) {
      return { ok: false as const, details: parsed.error.flatten() }
    }
    const updated = await this.prisma.comment.update({
      where: { id: comment.id },
      data: { content: parsed.data.content },
    })
    return {
      id: updated.id,
      recipeId: updated.recipeId,
      authorId: updated.authorId,
      authorName: updated.authorName,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : undefined,
    } satisfies ApiComment
  }

  async deleteComment(recipeId: string, commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment || comment.recipeId !== recipeId) throw new NotFoundException({ error: 'Comment not found' })
    if (comment.authorId !== userId) throw new ForbiddenException({ error: 'Only the author can delete this comment' })
    await this.prisma.comment.delete({ where: { id: comment.id } })
  }

  async putRating(id: string, body: unknown, userId: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id } })
    if (!recipe) throw new NotFoundException({ error: 'Recipe not found' })
    const parsed = RatingBody.safeParse(body)
    if (!parsed.success) {
      return { ok: false as const, details: parsed.error.flatten() }
    }
    const ratingValue = parsed.data.rating
    await this.prisma.rating.upsert({
      where: {
        recipeId_userId: { recipeId: recipe.id, userId },
      },
      create: { recipeId: recipe.id, userId, rating: ratingValue },
      update: { rating: ratingValue },
    })
    const allRatings = await this.prisma.rating.findMany({ where: { recipeId: recipe.id } })
    const ratingCount = allRatings.length
    const averageRating =
      ratingCount === 0 ? 0 : allRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
    await this.prisma.recipe.update({
      where: { id: recipe.id },
      data: { averageRating, ratingCount },
    })
    const updated = await this.prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: { ratings: true, comments: true },
    })
    return this.toApiRecipe(updated!)
  }

  async getMyRating(id: string, userId: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id } })
    if (!recipe) throw new NotFoundException({ error: 'Recipe not found' })
    const r = await this.prisma.rating.findUnique({
      where: { recipeId_userId: { recipeId: recipe.id, userId } },
    })
    return { rating: r ? r.rating : null }
  }
}
