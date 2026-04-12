import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { PrismaService } from '../prisma/prisma.service'
import type { ShoppingList, ShoppingListItem } from '../types'

type ShoppingListWithItems = Prisma.ShoppingListGetPayload<{ include: { items: true } }>

const GenerateBody = z.object({ recipeIds: z.array(z.string()) })
const AddItemBody = z.object({
  name: z.string().min(1),
  amount: z.number().optional(),
  unit: z.string().optional(),
})
const UpdateItemBody = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  purchased: z.boolean().optional(),
})

@Injectable()
export class ShoppingListService {
  constructor(private prisma: PrismaService) {}

  private toApiList(db: ShoppingListWithItems): ShoppingList {
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

  async getOrCreateList(userId: string) {
    let list = await this.prisma.shoppingList.findUnique({
      where: { userId },
      include: { items: true },
    })
    if (!list) {
      list = await this.prisma.shoppingList.create({
        data: { userId },
        include: { items: true },
      })
    }
    return list
  }

  async get(userId: string) {
    return this.toApiList(await this.getOrCreateList(userId))
  }

  async generate(userId: string, body: unknown) {
    const parsed = GenerateBody.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Validation failed', details: parsed.error.flatten() })
    }
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: parsed.data.recipeIds } },
    })
    const byKey = new Map<string, { name: string; amount?: number; unit?: string }>()
    type IngredientJson = { name: string; amount?: number | null; unit?: string | null }
    for (const recipe of recipes) {
      const ingredients = (Array.isArray(recipe.ingredients) ? recipe.ingredients : []) as IngredientJson[]
      for (const ing of ingredients) {
        const key = `${String(ing.name).toLowerCase()}_${ing.unit ?? ''}`
        const existing = byKey.get(key)
        if (existing) {
          if (existing.unit === ing.unit && existing.amount != null && ing.amount != null) {
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
    const list = await this.getOrCreateList(userId)
    await this.prisma.shoppingListItem.deleteMany({ where: { listId: list.id } })
    const entries = Array.from(byKey.values())
    if (entries.length > 0) {
      await this.prisma.shoppingListItem.createMany({
        data: entries.map((v) => ({
          listId: list.id,
          name: v.name,
          amount: v.amount,
          unit: v.unit,
          purchased: false,
        })),
      })
    }
    return this.toApiList(await this.getOrCreateList(userId))
  }

  async addItem(userId: string, body: unknown) {
    const parsed = AddItemBody.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Validation failed', details: parsed.error.flatten() })
    }
    const list = await this.getOrCreateList(userId)
    await this.prisma.shoppingListItem.create({
      data: {
        listId: list.id,
        name: parsed.data.name,
        amount: parsed.data.amount,
        unit: parsed.data.unit,
      },
    })
    return this.toApiList(await this.getOrCreateList(userId))
  }

  async patchItem(userId: string, itemId: string, body: unknown) {
    const list = await this.getOrCreateList(userId)
    const item = list.items.find((i) => i.id === itemId)
    if (!item) throw new NotFoundException({ error: 'Item not found' })
    const parsed = UpdateItemBody.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Validation failed', details: parsed.error.flatten() })
    }
    await this.prisma.shoppingListItem.update({ where: { id: item.id }, data: parsed.data })
    return this.toApiList(await this.getOrCreateList(userId))
  }

  async deleteItem(userId: string, itemId: string) {
    const list = await this.getOrCreateList(userId)
    const item = list.items.find((i) => i.id === itemId)
    if (!item) throw new NotFoundException({ error: 'Item not found' })
    await this.prisma.shoppingListItem.delete({ where: { id: item.id } })
    return this.toApiList(await this.getOrCreateList(userId))
  }

  async togglePurchased(userId: string, itemId: string) {
    const list = await this.getOrCreateList(userId)
    const item = list.items.find((i) => i.id === itemId)
    if (!item) throw new NotFoundException({ error: 'Item not found' })
    await this.prisma.shoppingListItem.update({
      where: { id: item.id },
      data: { purchased: !item.purchased },
    })
    return this.toApiList(await this.getOrCreateList(userId))
  }

  async clear(userId: string) {
    const list = await this.getOrCreateList(userId)
    await this.prisma.shoppingListItem.deleteMany({ where: { listId: list.id } })
    return this.toApiList(await this.getOrCreateList(userId))
  }
}
