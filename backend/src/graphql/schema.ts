import { buildSchema } from 'graphql'
import { prisma } from '../db.js'
import { RecipeFormSchema } from '../types.js'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import type { AuthPayload } from '../types.js'
// #region agent log
import { DBG } from '../debugLog.js'
// #endregion

export const schema = buildSchema(`
  type Recipe {
    id: ID!
    title: String!
    cookingTime: Int!
    difficulty: String!
    cuisine: String!
    tags: [String!]!
    coverImage: String
    ingredients: [Ingredient!]!
    instructions: [String!]!
    nutrition: Nutrition
    authorId: ID!
    authorName: String!
    averageRating: Float!
    ratingCount: Int!
    ratings: [Rating!]!
    comments: [Comment!]!
    createdAt: String!
    updatedAt: String!
  }

  type Ingredient {
    id: String!
    name: String!
    amount: Float
    unit: String
  }

  type Nutrition {
    calories: Float
    protein: Float
    carbs: Float
    fat: Float
    fiber: Float
  }

  type Rating {
    userId: String!
    rating: Int!
  }

  type Comment {
    id: ID!
    recipeId: ID!
    authorId: ID!
    authorName: String!
    content: String!
    createdAt: String!
    updatedAt: String
  }

  type RecipeList {
    items: [Recipe!]!
    total: Int!
  }

  type User {
    id: ID!
    name: String!
    role: String!
  }

  type Favorites {
    userId: ID!
    recipeIds: [ID!]!
  }

  type PlannerDay {
    date: String!
    recipeIds: [ID!]!
  }

  type Planner {
    weekStart: String!
    days: [PlannerDay!]!
  }

  type ShoppingListItem {
    id: ID!
    name: String!
    amount: Float
    unit: String
    purchased: Boolean!
  }

  type ShoppingList {
    id: ID!
    items: [ShoppingListItem!]!
    createdAt: String!
    updatedAt: String!
  }

  input RecipeFormInput {
    title: String!
    cookingTime: Int!
    difficulty: String!
    cuisine: String!
    tags: [String!]
    coverImage: String
    ingredients: [IngredientInput!]!
    instructions: [String!]!
    nutrition: NutritionInput
  }

  input IngredientInput {
    id: String!
    name: String!
    amount: Float
    unit: String
  }

  input NutritionInput {
    calories: Float
    protein: Float
    carbs: Float
    fat: Float
    fiber: Float
  }

  input ShoppingListItemInput {
    name: String!
    amount: Float
    unit: String
  }

  type Query {
    recipes(
      search: String
      cuisine: String
      difficulty: String
      tag: String
      maxTime: Int
      page: Int
      limit: Int
    ): RecipeList!
    recipe(id: ID!): Recipe
    recipeRating(recipeId: ID!): Int
    me: User
    favorites: Favorites
    planner(weekStart: String): Planner
    shoppingList: ShoppingList
    isFavorite(recipeId: ID!): Boolean!
  }

  type Mutation {
    createRecipe(input: RecipeFormInput!): Recipe!
    updateRecipe(id: ID!, input: RecipeFormInput!): Recipe!
    deleteRecipe(id: ID!): Boolean!
    addComment(recipeId: ID!, content: String!): Comment!
    updateComment(recipeId: ID!, commentId: ID!, content: String!): Comment!
    deleteComment(recipeId: ID!, commentId: ID!): Boolean!
    setRating(recipeId: ID!, rating: Int!): Recipe!
    addRecipeToPlanner(weekStart: String, dayIndex: Int!, recipeId: ID!): Planner!
    removeRecipeFromPlanner(weekStart: String, dayIndex: Int!, recipeId: ID!): Planner!
    moveRecipeInPlanner(recipeId: ID!, weekStart: String!, fromDayIndex: Int!, toDayIndex: Int!): Planner!
    clearPlannerDay(weekStart: String, dayIndex: Int!): Planner!
    clearPlannerWeek(weekStart: String): Planner!
    generateShoppingList(recipeIds: [ID!]!): ShoppingList!
    addShoppingListItem(name: String!, amount: Float, unit: String): ShoppingList!
    updateShoppingListItem(itemId: ID!, name: String, amount: Float, unit: String, purchased: Boolean): ShoppingList!
    deleteShoppingListItem(itemId: ID!): ShoppingList!
    toggleShoppingListItemPurchased(itemId: ID!): ShoppingList!
    clearShoppingList: ShoppingList!
    addFavorite(recipeId: ID!): Favorites!
    removeFavorite(recipeId: ID!): Favorites!
  }
`)

export interface GraphQLContext {
  user: AuthPayload | null
}

function requireUser(ctx: GraphQLContext): AuthPayload {
  if (!ctx?.user) throw new Error('Unauthorized')
  return ctx.user
}

function normalizeWeekStart(weekStart?: string | null): string {
  if (weekStart) return weekStart
  const now = new Date()
  return format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

async function getOrCreatePlanner(userId: string, weekStartParam?: string | null) {
  const weekStart = normalizeWeekStart(weekStartParam)
  let planner = await prisma.planner.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
    include: { days: { orderBy: { dayIndex: 'asc' } } },
  })
  if (!planner) {
    const monday = parseISO(weekStart)
    planner = await prisma.planner.create({
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

async function getOrCreateFavorites(userId: string) {
  let fav = await prisma.favorites.findUnique({ where: { userId } })
  if (!fav) fav = await prisma.favorites.create({ data: { userId, recipeIds: [] } })
  return fav
}

async function getOrCreateShoppingList(userId: string) {
  let list = await prisma.shoppingList.findUnique({ where: { userId }, include: { items: true } })
  if (!list) list = await prisma.shoppingList.create({ data: { userId }, include: { items: true } })
  return list
}

function mapRecipe(r: any, includeRelations = false) {
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

export function createRoot() {
  return {
    // --- Query ---
    recipes: async (args: any) => {
      const page = Math.max(1, args?.page ?? 1)
      const limit = Math.min(50, Math.max(1, args?.limit ?? 12))
      const where: any = {}
      if (args?.search) where.title = { contains: args.search, mode: 'insensitive' }
      if (args?.cuisine) where.cuisine = args.cuisine
      if (args?.difficulty) where.difficulty = args.difficulty
      if (args?.tag) where.tags = { has: args.tag }
      if (args?.maxTime != null) where.cookingTime = { lte: args.maxTime }
      const [total, items] = await Promise.all([
        prisma.recipe.count({ where }),
        prisma.recipe.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      ])
      return { total, items: items.map((r) => mapRecipe(r, false)) }
    },

    recipe: async (args: { id?: string }) => {
      const id = args?.id
      if (!id) return null
      const r = await prisma.recipe.findUnique({ where: { id }, include: { comments: true, ratings: true } })
      return r ? mapRecipe(r, true) : null
    },

    recipeRating: async (args: { recipeId?: string }, ctx: GraphQLContext) => {
      // #region agent log
      DBG('schema.ts:recipeRating', 'recipeRating resolver', {
        argCount: arguments.length,
        ctxKeys: ctx ? Object.keys(ctx) : [],
        hasUser: !!ctx?.user,
        userId: ctx?.user?.userId,
      }, 'H3,H4')
      // #endregion
      const user = requireUser(ctx)
      const recipeId = args?.recipeId ?? ''
      const r = await prisma.rating.findUnique({
        where: { recipeId_userId: { recipeId, userId: user.userId } },
      })
      return r ? r.rating : 0
    },

    me: async (_args: any, ctx: GraphQLContext) => {
      if (!ctx?.user) return null
      return { id: ctx.user.userId, name: ctx.user.name, role: ctx.user.role ?? 'user' }
    },

    favorites: async (_args: any, ctx: GraphQLContext) => {
      // #region agent log
      DBG('schema.ts:favorites', 'favorites resolver', {
        argCount: arguments.length,
        ctxKeys: ctx ? Object.keys(ctx) : [],
        hasUser: !!ctx?.user,
        userId: ctx?.user?.userId,
      }, 'H3,H4')
      // #endregion
      const user = requireUser(ctx)
      const fav = await getOrCreateFavorites(user.userId)
      return { userId: fav.userId, recipeIds: fav.recipeIds }
    },

    planner: async (args: { weekStart?: string | null }, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const p = await getOrCreatePlanner(user.userId, args?.weekStart)
      return {
        weekStart: p.weekStart,
        days: p.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })),
      }
    },

    shoppingList: async (_args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const list = await getOrCreateShoppingList(user.userId)
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
    },

    isFavorite: async (args: { recipeId?: string }, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const fav = await getOrCreateFavorites(user.userId)
      return fav.recipeIds.includes(args?.recipeId ?? '')
    },

    // --- Mutation ---
    createRecipe: async (args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const { input } = args || {}
      const parsed = RecipeFormSchema.safeParse({
        ...input,
        authorId: user.userId,
        authorName: user.name,
      })
      if (!parsed.success) throw new Error('Validation failed')
      const created = await prisma.recipe.create({
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
      const full = await prisma.recipe.findUnique({ where: { id: created.id }, include: { comments: true, ratings: true } })
      return mapRecipe(full!, true)
    },

    updateRecipe: async (args: any, ctx: GraphQLContext) => {
      const { id, input } = args || {}
      const user = requireUser(ctx)
      const existing = await prisma.recipe.findUnique({ where: { id } })
      if (!existing) throw new Error('Recipe not found')
      if (existing.authorId !== user.userId) throw new Error('Forbidden')
      const parsed = RecipeFormSchema.safeParse({ ...input, authorId: existing.authorId, authorName: existing.authorName })
      if (!parsed.success) throw new Error('Validation failed')
      await prisma.recipe.update({
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
      const full = await prisma.recipe.findUnique({ where: { id }, include: { comments: true, ratings: true } })
      return mapRecipe(full!, true)
    },

    deleteRecipe: async (args: { id?: string }, ctx: GraphQLContext) => {
      const { id } = args || {}
      const user = requireUser(ctx)
      const existing = await prisma.recipe.findUnique({ where: { id } })
      if (!existing) throw new Error('Recipe not found')
      if (existing.authorId !== user.userId) throw new Error('Forbidden')
      await prisma.recipe.delete({ where: { id } })
      return true
    },

    addComment: async (args: any, ctx: GraphQLContext) => {
      const { recipeId, content } = args || {}
      const user = requireUser(ctx)
      const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
      if (!recipe) throw new Error('Recipe not found')
      const c = await prisma.comment.create({
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
    },

    updateComment: async (args: any, ctx: GraphQLContext) => {
      const { recipeId, commentId, content } = args || {}
      const user = requireUser(ctx)
      const comment = await prisma.comment.findUnique({ where: { id: commentId } })
      if (!comment || comment.recipeId !== recipeId) throw new Error('Comment not found')
      if (comment.authorId !== user.userId) throw new Error('Forbidden')
      const c = await prisma.comment.update({ where: { id: commentId }, data: { content } })
      return {
        id: c.id,
        recipeId: c.recipeId,
        authorId: c.authorId,
        authorName: c.authorName,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
      }
    },

    deleteComment: async (args: any, ctx: GraphQLContext) => {
      const { recipeId, commentId } = args || {}
      const user = requireUser(ctx)
      const comment = await prisma.comment.findUnique({ where: { id: commentId } })
      if (!comment || comment.recipeId !== recipeId) throw new Error('Comment not found')
      if (comment.authorId !== user.userId) throw new Error('Forbidden')
      await prisma.comment.delete({ where: { id: commentId } })
      return true
    },

    setRating: async (args: any, ctx: GraphQLContext) => {
      const { recipeId, rating } = args || {}
      const user = requireUser(ctx)
      if (rating < 1 || rating > 5) throw new Error('Rating must be 1-5')
      const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
      if (!recipe) throw new Error('Recipe not found')
      await prisma.rating.upsert({
        where: { recipeId_userId: { recipeId, userId: user.userId } },
        create: { recipeId, userId: user.userId, rating },
        update: { rating },
      })
      const allRatings = await prisma.rating.findMany({ where: { recipeId } })
      const ratingCount = allRatings.length
      const averageRating = ratingCount === 0 ? 0 : allRatings.reduce((s, r) => s + r.rating, 0) / ratingCount
      await prisma.recipe.update({ where: { id: recipeId }, data: { averageRating, ratingCount } })
      const full = await prisma.recipe.findUnique({ where: { id: recipeId }, include: { comments: true, ratings: true } })
      return mapRecipe(full!, true)
    },

    addRecipeToPlanner: async (args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const { weekStart, dayIndex, recipeId } = args
      if (dayIndex < 0 || dayIndex > 6) throw new Error('dayIndex must be 0-6')
      const p = await getOrCreatePlanner(user.userId, weekStart)
      const day = p.days.find((d) => d.dayIndex === dayIndex)
      if (!day) throw new Error('Invalid dayIndex')
      const recipeIds = day.recipeIds.includes(recipeId) ? day.recipeIds : [...day.recipeIds, recipeId]
      await prisma.plannerDay.update({
        where: { plannerId_dayIndex: { plannerId: p.id, dayIndex } },
        data: { recipeIds },
      })
      const updated = await getOrCreatePlanner(user.userId, p.weekStart)
      return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
    },

    removeRecipeFromPlanner: async (args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const { weekStart, dayIndex, recipeId } = args
      if (dayIndex < 0 || dayIndex > 6) throw new Error('dayIndex must be 0-6')
      const p = await getOrCreatePlanner(user.userId, weekStart)
      const day = p.days.find((d) => d.dayIndex === dayIndex)
      if (!day) throw new Error('Invalid dayIndex')
      const recipeIds = day.recipeIds.filter((id) => id !== recipeId)
      await prisma.plannerDay.update({
        where: { plannerId_dayIndex: { plannerId: p.id, dayIndex } },
        data: { recipeIds },
      })
      const updated = await getOrCreatePlanner(user.userId, p.weekStart)
      return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
    },

    moveRecipeInPlanner: async (args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const { recipeId, weekStart, fromDayIndex, toDayIndex } = args
      const p = await getOrCreatePlanner(user.userId, weekStart)
      const fromDay = p.days.find((d) => d.dayIndex === fromDayIndex)
      const toDay = p.days.find((d) => d.dayIndex === toDayIndex)
      if (!fromDay || !toDay) throw new Error('Invalid day indices')
      if (!fromDay.recipeIds.includes(recipeId)) throw new Error('Recipe not in source day')
      const newFrom = fromDay.recipeIds.filter((id) => id !== recipeId)
      const newTo = toDay.recipeIds.includes(recipeId) ? toDay.recipeIds : [...toDay.recipeIds, recipeId]
      await prisma.$transaction([
        prisma.plannerDay.update({
          where: { plannerId_dayIndex: { plannerId: p.id, dayIndex: fromDayIndex } },
          data: { recipeIds: newFrom },
        }),
        prisma.plannerDay.update({
          where: { plannerId_dayIndex: { plannerId: p.id, dayIndex: toDayIndex } },
          data: { recipeIds: newTo },
        }),
      ])
      const updated = await getOrCreatePlanner(user.userId, weekStart)
      return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
    },

    clearPlannerDay: async (args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const { weekStart, dayIndex } = args
      if (dayIndex < 0 || dayIndex > 6) throw new Error('dayIndex must be 0-6')
      const p = await getOrCreatePlanner(user.userId, weekStart)
      await prisma.plannerDay.update({
        where: { plannerId_dayIndex: { plannerId: p.id, dayIndex } },
        data: { recipeIds: [] },
      })
      const updated = await getOrCreatePlanner(user.userId, p.weekStart)
      return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
    },

    clearPlannerWeek: async (args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const weekStart = normalizeWeekStart(args.weekStart)
      const p = await getOrCreatePlanner(user.userId, weekStart)
      await prisma.plannerDay.updateMany({ where: { plannerId: p.id }, data: { recipeIds: [] } })
      const updated = await getOrCreatePlanner(user.userId, weekStart)
      return { weekStart: updated.weekStart, days: updated.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })) }
    },

    generateShoppingList: async (args: any, ctx: GraphQLContext) => {
      const { recipeIds } = args || {}
      const user = requireUser(ctx)
      const recipes = await prisma.recipe.findMany({ where: { id: { in: recipeIds ?? [] } } })
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
      const list = await getOrCreateShoppingList(user.userId)
      await prisma.shoppingListItem.deleteMany({ where: { listId: list.id } })
      const entries = Array.from(byKey.values())
      if (entries.length > 0) {
        await prisma.shoppingListItem.createMany({
          data: entries.map((v) => ({ listId: list.id, name: v.name, amount: v.amount, unit: v.unit, purchased: false })),
        })
      }
      const updated = await getOrCreateShoppingList(user.userId)
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
    },

    addShoppingListItem: async (args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const list = await getOrCreateShoppingList(user.userId)
      await prisma.shoppingListItem.create({
        data: { listId: list.id, name: args?.name, amount: args?.amount, unit: args?.unit },
      })
      const updated = await getOrCreateShoppingList(user.userId)
      return {
        id: updated.id,
        items: updated.items.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, purchased: i.purchased })),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      }
    },

    updateShoppingListItem: async (args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const list = await getOrCreateShoppingList(user.userId)
      const itemId = args?.itemId
      const item = list.items.find((i) => i.id === itemId)
      if (!item) throw new Error('Item not found')
      const data: any = {}
      if (args?.name !== undefined) data.name = args.name
      if (args?.amount !== undefined) data.amount = args.amount
      if (args?.unit !== undefined) data.unit = args.unit
      if (args?.purchased !== undefined) data.purchased = args.purchased
      await prisma.shoppingListItem.update({ where: { id: itemId }, data })
      const updated = await getOrCreateShoppingList(user.userId)
      return {
        id: updated.id,
        items: updated.items.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, purchased: i.purchased })),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      }
    },

    deleteShoppingListItem: async (args: any, ctx: GraphQLContext) => {
      const { itemId } = args || {}
      const user = requireUser(ctx)
      const list = await getOrCreateShoppingList(user.userId)
      const item = list.items.find((i) => i.id === itemId)
      if (!item) throw new Error('Item not found')
      await prisma.shoppingListItem.delete({ where: { id: itemId } })
      const updated = await getOrCreateShoppingList(user.userId)
      return {
        id: updated.id,
        items: updated.items.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, purchased: i.purchased })),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      }
    },

    toggleShoppingListItemPurchased: async (args: any, ctx: GraphQLContext) => {
      const { itemId } = args || {}
      const user = requireUser(ctx)
      const list = await getOrCreateShoppingList(user.userId)
      const item = list.items.find((i) => i.id === itemId)
      if (!item) throw new Error('Item not found')
      await prisma.shoppingListItem.update({ where: { id: itemId }, data: { purchased: !item.purchased } })
      const updated = await getOrCreateShoppingList(user.userId)
      return {
        id: updated.id,
        items: updated.items.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, purchased: i.purchased })),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      }
    },

    clearShoppingList: async (_parent: any, _args: any, ctx: GraphQLContext) => {
      const user = requireUser(ctx)
      const list = await getOrCreateShoppingList(user.userId)
      await prisma.shoppingListItem.deleteMany({ where: { listId: list.id } })
      const updated = await getOrCreateShoppingList(user.userId)
      return {
        id: updated.id,
        items: [],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      }
    },

    addFavorite: async (args: any, ctx: GraphQLContext) => {
      const { recipeId } = args || {}
      const user = requireUser(ctx)
      const fav = await getOrCreateFavorites(user.userId)
      const recipeIds = fav.recipeIds.includes(recipeId) ? fav.recipeIds : [...fav.recipeIds, recipeId]
      const updated = await prisma.favorites.update({ where: { userId: user.userId }, data: { recipeIds } })
      return { userId: updated.userId, recipeIds: updated.recipeIds }
    },

    removeFavorite: async (args: any, ctx: GraphQLContext) => {
      const { recipeId } = args || {}
      const user = requireUser(ctx)
      const fav = await getOrCreateFavorites(user.userId)
      const recipeIds = fav.recipeIds.filter((id) => id !== recipeId)
      const updated = await prisma.favorites.update({ where: { userId: user.userId }, data: { recipeIds } })
      return { userId: updated.userId, recipeIds: updated.recipeIds }
    },
  }
}
