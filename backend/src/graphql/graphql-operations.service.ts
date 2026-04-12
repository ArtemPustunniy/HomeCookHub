import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { RecipeFormSchema } from '../types'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import type { AuthPayload } from '../types'
import { PrismaService } from '../prisma/prisma.service'

export interface GraphQLContext {
  user: AuthPayload | null
}

function requireUser(ctx: GraphQLContext): AuthPayload {
  if (!ctx?.user) throw new UnauthorizedException('Unauthorized')
  return ctx.user
}

function normalizeWeekStart(weekStart?: string | null): string {
  if (weekStart) return weekStart
  const now = new Date()
  return format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function mapRecipeGql(r: any, includeRelations = false) {
  const base = {
    id: r.id,
    title: r.title,
    cookingTime: r.cookingTime,
    difficulty: r.difficulty,
    cuisine: r.cuisine,
    tags: r.tags ?? [],
    coverImage: r.coverImage ?? '',
    ingredients: r.ingredients ?? [],
    instructions: r.instructions ?? [],
    nutrition: r.nutrition ?? null,
    authorId: r.authorId,
    authorName: r.authorName,
    averageRating: r.averageRating ?? 0,
    ratingCount: r.ratingCount ?? 0,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
  if (includeRelations) {
    return {
      ...base,
      ratings: (r.ratings ?? []).map((x: any) => ({ userId: x.userId, rating: x.rating })),
      comments: (r.comments ?? []).map((c: any) => ({
        id: c.id,
        recipeId: c.recipeId,
        authorId: c.authorId,
        authorName: c.authorName,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
      })),
    }
  }
  return { ...base, ratings: [], comments: [] }
}

@Injectable()
export class GraphqlOperationsService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreatePlanner(userId: string, weekStartParam?: string | null) {
    const weekStart = normalizeWeekStart(weekStartParam)
    let planner = await this.prisma.planner.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      include: { days: { orderBy: { dayIndex: 'asc' } } },
    })
    if (!planner) {
      const monday = parseISO(weekStart)
      planner = await this.prisma.planner.create({
        data: {
          userId,
          weekStart,
          days: {
            create: Array.from({ length: 7 }, (_, i) => ({
              dayIndex: i,
              date: format(addDays(monday, i), 'yyyy-MM-dd'),
              recipeIds: [],
            })),
          },
        },
        include: { days: { orderBy: { dayIndex: 'asc' } } },
      })
    }
    return planner
  }

  private async getOrCreateFavorites(userId: string) {
    let fav = await this.prisma.favorites.findUnique({ where: { userId } })
    if (!fav) fav = await this.prisma.favorites.create({ data: { userId, recipeIds: [] } })
    return fav
  }

  private async getOrCreateShoppingList(userId: string) {
    let list = await this.prisma.shoppingList.findUnique({ where: { userId }, include: { items: true } })
    if (!list) list = await this.prisma.shoppingList.create({ data: { userId }, include: { items: true } })
    return list
  }

  async recipes(args: any) {
    const page = Math.max(1, args?.page ?? 1)
    const limit = Math.min(50, Math.max(1, args?.limit ?? 12))
    const where: any = {}
    if (args?.search) where.title = { contains: args.search, mode: 'insensitive' }
    if (args?.cuisine) where.cuisine = args.cuisine
    if (args?.difficulty) where.difficulty = args.difficulty
    if (args?.tag) where.tags = { has: args.tag }
    if (args?.maxTime != null) where.cookingTime = { lte: args.maxTime }
    const [total, items] = await Promise.all([
      this.prisma.recipe.count({ where }),
      this.prisma.recipe.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    ])
    return { total, items: items.map((r) => mapRecipeGql(r, false)) }
  }

  async recipe(args: { id?: string }) {
    const id = args?.id
    if (!id) return null
    const r = await this.prisma.recipe.findUnique({ where: { id }, include: { comments: true, ratings: true } })
    return r ? mapRecipeGql(r, true) : null
  }

  async recipeRating(args: { recipeId?: string }, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const recipeId = args?.recipeId ?? ''
    const row = await this.prisma.rating.findUnique({
      where: { recipeId_userId: { recipeId, userId: user.userId } },
    })
    return row ? row.rating : 0
  }

  async me(_args: any, ctx: GraphQLContext) {
    if (!ctx?.user) return null
    return { id: ctx.user.userId, name: ctx.user.name, role: ctx.user.role ?? 'user' }
  }

  async favorites(_args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const fav = await this.getOrCreateFavorites(user.userId)
    return { userId: fav.userId, recipeIds: fav.recipeIds }
  }

  async planner(args: { weekStart?: string | null }, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const p = await this.getOrCreatePlanner(user.userId, args?.weekStart)
    return {
      weekStart: p.weekStart,
      days: p.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })),
    }
  }

  async shoppingList(_args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const list = await this.getOrCreateShoppingList(user.userId)
    return {
      id: list.id,
      items: list.items.map((i) => ({
        id: i.id,
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        purchased: i.purchased,
      })),
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    }
  }

  async isFavorite(args: { recipeId?: string }, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const fav = await this.getOrCreateFavorites(user.userId)
    return fav.recipeIds.includes(args?.recipeId ?? '')
  }

  async createRecipe(args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const { input } = args || {}
    const parsed = RecipeFormSchema.safeParse({
      ...input,
      authorId: user.userId,
      authorName: user.name,
    })
    if (!parsed.success) {
      const issues = parsed.error.issues
      const hint = issues[0] ? `${issues[0].path.join('.')}: ${issues[0].message}` : 'Validation failed'
      throw new BadRequestException({
        message: hint,
        details: parsed.error.flatten(),
        issues,
      })
    }
    const created = await this.prisma.recipe.create({
      data: {
        title: parsed.data.title,
        cookingTime: parsed.data.cookingTime,
        difficulty: parsed.data.difficulty,
        cuisine: parsed.data.cuisine,
        tags: parsed.data.tags ?? [],
        coverImage: parsed.data.coverImage && parsed.data.coverImage.length > 0 ? parsed.data.coverImage : null,
        ingredients: parsed.data.ingredients,
        instructions: parsed.data.instructions,
        nutrition: parsed.data.nutrition ?? undefined,
        authorId: user.userId,
        authorName: user.name,
      },
    })
    const full = await this.prisma.recipe.findUnique({ where: { id: created.id }, include: { comments: true, ratings: true } })
    return mapRecipeGql(full!, true)
  }

  async updateRecipe(args: any, ctx: GraphQLContext) {
    const { id, input } = args || {}
    const user = requireUser(ctx)
    const existing = await this.prisma.recipe.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Recipe not found')
    if (existing.authorId !== user.userId) throw new ForbiddenException('Forbidden')
    const parsed = RecipeFormSchema.safeParse({ ...input, authorId: existing.authorId, authorName: existing.authorName })
    if (!parsed.success) {
      const issues = parsed.error.issues
      const hint = issues[0] ? `${issues[0].path.join('.')}: ${issues[0].message}` : 'Validation failed'
      throw new BadRequestException({
        message: hint,
        details: parsed.error.flatten(),
        issues,
      })
    }
    await this.prisma.recipe.update({
      where: { id },
      data: {
        title: parsed.data.title,
        cookingTime: parsed.data.cookingTime,
        difficulty: parsed.data.difficulty,
        cuisine: parsed.data.cuisine,
        tags: parsed.data.tags ?? [],
        coverImage: parsed.data.coverImage && parsed.data.coverImage.length > 0 ? parsed.data.coverImage : null,
        ingredients: parsed.data.ingredients,
        instructions: parsed.data.instructions,
        nutrition: parsed.data.nutrition ?? undefined,
      },
    })
    const full = await this.prisma.recipe.findUnique({ where: { id }, include: { comments: true, ratings: true } })
    return mapRecipeGql(full!, true)
  }

  async deleteRecipe(args: { id?: string }, ctx: GraphQLContext) {
    const { id } = args || {}
    const user = requireUser(ctx)
    const existing = await this.prisma.recipe.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Recipe not found')
    if (existing.authorId !== user.userId) throw new ForbiddenException('Forbidden')
    await this.prisma.recipe.delete({ where: { id } })
    return true
  }

  async addComment(args: any, ctx: GraphQLContext) {
    const { recipeId, content } = args || {}
    const user = requireUser(ctx)
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) throw new NotFoundException('Recipe not found')
    const c = await this.prisma.comment.create({
      data: { recipeId, authorId: user.userId, authorName: user.name, content },
    })
    return {
      id: c.id,
      recipeId: c.recipeId,
      authorId: c.authorId,
      authorName: c.authorName,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
    }
  }

  async updateComment(args: any, ctx: GraphQLContext) {
    const { recipeId, commentId, content } = args || {}
    const user = requireUser(ctx)
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment || comment.recipeId !== recipeId) throw new NotFoundException('Comment not found')
    if (comment.authorId !== user.userId) throw new ForbiddenException('Forbidden')
    const c = await this.prisma.comment.update({ where: { id: commentId }, data: { content } })
    return {
      id: c.id,
      recipeId: c.recipeId,
      authorId: c.authorId,
      authorName: c.authorName,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
    }
  }

  async deleteComment(args: any, ctx: GraphQLContext) {
    const { recipeId, commentId } = args || {}
    const user = requireUser(ctx)
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment || comment.recipeId !== recipeId) throw new NotFoundException('Comment not found')
    if (comment.authorId !== user.userId) throw new ForbiddenException('Forbidden')
    await this.prisma.comment.delete({ where: { id: commentId } })
    return true
  }

  async setRating(args: any, ctx: GraphQLContext) {
    const { recipeId, rating } = args || {}
    const user = requireUser(ctx)
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be 1-5')
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) throw new NotFoundException('Recipe not found')
    await this.prisma.rating.upsert({
      where: { recipeId_userId: { recipeId, userId: user.userId } },
      create: { recipeId, userId: user.userId, rating },
      update: { rating },
    })
    const allRatings = await this.prisma.rating.findMany({ where: { recipeId } })
    const ratingCount = allRatings.length
    const averageRating = ratingCount === 0 ? 0 : allRatings.reduce((s, r) => s + r.rating, 0) / ratingCount
    await this.prisma.recipe.update({ where: { id: recipeId }, data: { averageRating, ratingCount } })
    const full = await this.prisma.recipe.findUnique({ where: { id: recipeId }, include: { comments: true, ratings: true } })
    return mapRecipeGql(full!, true)
  }

  async addRecipeToPlanner(args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const { weekStart, dayIndex, recipeId } = args
    if (dayIndex < 0 || dayIndex > 6) throw new BadRequestException('dayIndex must be 0-6')
    const p = await this.getOrCreatePlanner(user.userId, weekStart)
    const day = p.days.find((d) => d.dayIndex === dayIndex)
    if (!day) throw new BadRequestException('Invalid dayIndex')
    const recipeIds = day.recipeIds.includes(recipeId) ? day.recipeIds : [...day.recipeIds, recipeId]
    await this.prisma.plannerDay.update({
      where: { plannerId_dayIndex: { plannerId: p.id, dayIndex } },
      data: { recipeIds },
    })
    const updated = await this.getOrCreatePlanner(user.userId, p.weekStart)
    return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
  }

  async removeRecipeFromPlanner(args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const { weekStart, dayIndex, recipeId } = args
    if (dayIndex < 0 || dayIndex > 6) throw new BadRequestException('dayIndex must be 0-6')
    const p = await this.getOrCreatePlanner(user.userId, weekStart)
    const day = p.days.find((d) => d.dayIndex === dayIndex)
    if (!day) throw new BadRequestException('Invalid dayIndex')
    const recipeIds = day.recipeIds.filter((rid) => rid !== recipeId)
    await this.prisma.plannerDay.update({
      where: { plannerId_dayIndex: { plannerId: p.id, dayIndex } },
      data: { recipeIds },
    })
    const updated = await this.getOrCreatePlanner(user.userId, p.weekStart)
    return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
  }

  async moveRecipeInPlanner(args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const { recipeId, weekStart, fromDayIndex, toDayIndex } = args
    const p = await this.getOrCreatePlanner(user.userId, weekStart)
    const fromDay = p.days.find((d) => d.dayIndex === fromDayIndex)
    const toDay = p.days.find((d) => d.dayIndex === toDayIndex)
    if (!fromDay || !toDay) throw new BadRequestException('Invalid day indices')
    if (!fromDay.recipeIds.includes(recipeId)) throw new BadRequestException('Recipe not in source day')
    const newFrom = fromDay.recipeIds.filter((rid) => rid !== recipeId)
    const newTo = toDay.recipeIds.includes(recipeId) ? toDay.recipeIds : [...toDay.recipeIds, recipeId]
    await this.prisma.$transaction([
      this.prisma.plannerDay.update({
        where: { plannerId_dayIndex: { plannerId: p.id, dayIndex: fromDayIndex } },
        data: { recipeIds: newFrom },
      }),
      this.prisma.plannerDay.update({
        where: { plannerId_dayIndex: { plannerId: p.id, dayIndex: toDayIndex } },
        data: { recipeIds: newTo },
      }),
    ])
    const updated = await this.getOrCreatePlanner(user.userId, weekStart)
    return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
  }

  async clearPlannerDay(args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const { weekStart, dayIndex } = args
    if (dayIndex < 0 || dayIndex > 6) throw new BadRequestException('dayIndex must be 0-6')
    const p = await this.getOrCreatePlanner(user.userId, weekStart)
    await this.prisma.plannerDay.update({
      where: { plannerId_dayIndex: { plannerId: p.id, dayIndex } },
      data: { recipeIds: [] },
    })
    const updated = await this.getOrCreatePlanner(user.userId, p.weekStart)
    return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
  }

  async clearPlannerWeek(args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const weekStart = normalizeWeekStart(args.weekStart)
    const p = await this.getOrCreatePlanner(user.userId, weekStart)
    await this.prisma.plannerDay.updateMany({ where: { plannerId: p.id }, data: { recipeIds: [] } })
    const updated = await this.getOrCreatePlanner(user.userId, weekStart)
    return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
  }

  async generateShoppingList(args: any, ctx: GraphQLContext) {
    const { recipeIds } = args || {}
    const user = requireUser(ctx)
    const recipes = await this.prisma.recipe.findMany({ where: { id: { in: recipeIds ?? [] } } })
    const byKey = new Map<string, { name: string; amount?: number; unit?: string }>()
    for (const recipe of recipes) {
      const ingredients = (recipe.ingredients ?? []) as any[]
      for (const ing of ingredients) {
        const key = `${String(ing.name).toLowerCase()}_${ing.unit ?? ''}`
        const existing = byKey.get(key)
        if (existing) {
          if (existing.unit === ing.unit && existing.amount != null && ing.amount != null)
            existing.amount = existing.amount + ing.amount
        } else byKey.set(key, { name: ing.name, amount: ing.amount, unit: ing.unit })
      }
    }
    const list = await this.getOrCreateShoppingList(user.userId)
    await this.prisma.shoppingListItem.deleteMany({ where: { listId: list.id } })
    const entries = Array.from(byKey.values())
    if (entries.length > 0) {
      await this.prisma.shoppingListItem.createMany({
        data: entries.map((v) => ({ listId: list.id, name: v.name, amount: v.amount, unit: v.unit, purchased: false })),
      })
    }
    const updated = await this.getOrCreateShoppingList(user.userId)
    return {
      id: updated.id,
      items: updated.items.map((i) => ({
        id: i.id,
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        purchased: i.purchased,
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async addShoppingListItem(args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const list = await this.getOrCreateShoppingList(user.userId)
    await this.prisma.shoppingListItem.create({
      data: { listId: list.id, name: args?.name, amount: args?.amount, unit: args?.unit },
    })
    const updated = await this.getOrCreateShoppingList(user.userId)
    return {
      id: updated.id,
      items: updated.items.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, purchased: i.purchased })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async updateShoppingListItem(args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const list = await this.getOrCreateShoppingList(user.userId)
    const itemId = args?.itemId
    const item = list.items.find((i) => i.id === itemId)
    if (!item) throw new NotFoundException('Item not found')
    const data: any = {}
    if (args?.name !== undefined) data.name = args.name
    if (args?.amount !== undefined) data.amount = args.amount
    if (args?.unit !== undefined) data.unit = args.unit
    if (args?.purchased !== undefined) data.purchased = args.purchased
    await this.prisma.shoppingListItem.update({ where: { id: itemId }, data })
    const updated = await this.getOrCreateShoppingList(user.userId)
    return {
      id: updated.id,
      items: updated.items.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, purchased: i.purchased })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async deleteShoppingListItem(args: any, ctx: GraphQLContext) {
    const { itemId } = args || {}
    const user = requireUser(ctx)
    const list = await this.getOrCreateShoppingList(user.userId)
    const item = list.items.find((i) => i.id === itemId)
    if (!item) throw new NotFoundException('Item not found')
    await this.prisma.shoppingListItem.delete({ where: { id: itemId } })
    const updated = await this.getOrCreateShoppingList(user.userId)
    return {
      id: updated.id,
      items: updated.items.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, purchased: i.purchased })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async toggleShoppingListItemPurchased(args: any, ctx: GraphQLContext) {
    const { itemId } = args || {}
    const user = requireUser(ctx)
    const list = await this.getOrCreateShoppingList(user.userId)
    const item = list.items.find((i) => i.id === itemId)
    if (!item) throw new NotFoundException('Item not found')
    await this.prisma.shoppingListItem.update({ where: { id: itemId }, data: { purchased: !item.purchased } })
    const updated = await this.getOrCreateShoppingList(user.userId)
    return {
      id: updated.id,
      items: updated.items.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, purchased: i.purchased })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async clearShoppingList(_args: any, ctx: GraphQLContext) {
    const user = requireUser(ctx)
    const list = await this.getOrCreateShoppingList(user.userId)
    await this.prisma.shoppingListItem.deleteMany({ where: { listId: list.id } })
    const updated = await this.getOrCreateShoppingList(user.userId)
    return {
      id: updated.id,
      items: [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async addFavorite(args: any, ctx: GraphQLContext) {
    const { recipeId } = args || {}
    const user = requireUser(ctx)
    const fav = await this.getOrCreateFavorites(user.userId)
    const recipeIds = fav.recipeIds.includes(recipeId) ? fav.recipeIds : [...fav.recipeIds, recipeId]
    const updated = await this.prisma.favorites.update({ where: { userId: user.userId }, data: { recipeIds } })
    return { userId: updated.userId, recipeIds: updated.recipeIds }
  }

  async removeFavorite(args: any, ctx: GraphQLContext) {
    const { recipeId } = args || {}
    const user = requireUser(ctx)
    const fav = await this.getOrCreateFavorites(user.userId)
    const recipeIds = fav.recipeIds.filter((rid) => rid !== recipeId)
    const updated = await this.prisma.favorites.update({ where: { userId: user.userId }, data: { recipeIds } })
    return { userId: updated.userId, recipeIds: updated.recipeIds }
  }
}
