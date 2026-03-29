import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import type { ShoppingList, ShoppingListItem } from '../types.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

type ShoppingListWithItems = Prisma.ShoppingListGetPayload<{ include: { items: true } }>

function toApiList(db: ShoppingListWithItems): ShoppingList {
  return {
    id: db.id,
    items: db.items.map(
      (i): ShoppingListItem => ({
        id: i.id,
        name: i.name,
        amount: i.amount ?? undefined,
        unit: i.unit ?? undefined,
        purchased: i.purchased,
      }),
    ),
    createdAt: db.createdAt.toISOString(),
    updatedAt: db.updatedAt.toISOString(),
  }
}

async function getOrCreateList(userId: string) {
  let list = await prisma.shoppingList.findUnique({
    where: { userId },
    include: { items: true },
  })
  if (!list) {
    list = await prisma.shoppingList.create({
      data: {
        userId,
      },
      include: { items: true },
    })
  }
  return list
}

// GET /shopping-list
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const list = await getOrCreateList(req.user!.userId)
  res.json(toApiList(list))
})

const GenerateBody = z.object({ recipeIds: z.array(z.string()) })

// POST /shopping-list/generate
router.post('/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = GenerateBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }

  const recipeIds = parsed.data.recipeIds
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: recipeIds } },
  })

  const byKey = new Map<
    string,
    {
      name: string
      amount?: number
      unit?: string
    }
  >()

  type IngredientJson = { name: string; amount?: number | null; unit?: string | null }
  for (const recipe of recipes) {
    const ingredients = (Array.isArray(recipe.ingredients) ? recipe.ingredients : []) as IngredientJson[]
    for (const ing of ingredients) {
      const key = `${String(ing.name).toLowerCase()}_${ing.unit ?? ''}`
      const existing = byKey.get(key)
      if (existing) {
        if (
          existing.unit === ing.unit &&
          existing.amount != null &&
          ing.amount != null
        ) {
          existing.amount = existing.amount + ing.amount
        }
      } else {
        byKey.set(key, {
          name: ing.name,
          amount: ing.amount ?? undefined,
          unit: ing.unit ?? undefined,
        })
      }
    }
  }

  const list = await getOrCreateList(req.user!.userId)

  await prisma.shoppingListItem.deleteMany({ where: { listId: list.id } })

  const entries = Array.from(byKey.values())
  if (entries.length > 0) {
    await prisma.shoppingListItem.createMany({
      data: entries.map((v) => ({
        listId: list.id,
        name: v.name,
        amount: v.amount,
        unit: v.unit,
        purchased: false,
      })),
    })
  }

  const updated = await getOrCreateList(req.user!.userId)
  res.json(toApiList(updated))
})

const AddItemBody = z.object({
  name: z.string().min(1),
  amount: z.number().optional(),
  unit: z.string().optional(),
})

// POST /shopping-list/items
router.post('/items', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = AddItemBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }

  const list = await getOrCreateList(req.user!.userId)
  await prisma.shoppingListItem.create({
    data: {
      listId: list.id,
      name: parsed.data.name,
      amount: parsed.data.amount,
      unit: parsed.data.unit,
    },
  })

  const updated = await getOrCreateList(req.user!.userId)
  res.status(201).json(toApiList(updated))
})

const UpdateItemBody = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  purchased: z.boolean().optional(),
})

// PATCH /shopping-list/items/:itemId
router.patch('/items/:itemId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const list = await getOrCreateList(req.user!.userId)
  const item = list.items.find((i) => i.id === req.params.itemId)
  if (!item) {
    res.status(404).json({ error: 'Item not found' })
    return
  }

  const parsed = UpdateItemBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }

  await prisma.shoppingListItem.update({
    where: { id: item.id },
    data: parsed.data,
  })

  const updated = await getOrCreateList(req.user!.userId)
  res.json(toApiList(updated))
})

// DELETE /shopping-list/items/:itemId
router.delete('/items/:itemId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const list = await getOrCreateList(req.user!.userId)
  const item = list.items.find((i) => i.id === req.params.itemId)
  if (!item) {
    res.status(404).json({ error: 'Item not found' })
    return
  }

  await prisma.shoppingListItem.delete({ where: { id: item.id } })

  const updated = await getOrCreateList(req.user!.userId)
  res.json(toApiList(updated))
})

// PATCH /shopping-list/items/:itemId/toggle-purchased
router.patch(
  '/items/:itemId/toggle-purchased',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const list = await getOrCreateList(req.user!.userId)
    const item = list.items.find((i) => i.id === req.params.itemId)
    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    await prisma.shoppingListItem.update({
      where: { id: item.id },
      data: { purchased: !item.purchased },
    })

    const updated = await getOrCreateList(req.user!.userId)
    res.json(toApiList(updated))
  },
)

// DELETE /shopping-list
router.delete('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const list = await getOrCreateList(req.user!.userId)
  await prisma.shoppingListItem.deleteMany({ where: { listId: list.id } })

  const updated = await getOrCreateList(req.user!.userId)
  res.json(toApiList(updated))
})

export default router

