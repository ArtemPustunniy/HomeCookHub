import { BadRequestException, Injectable } from '@nestjs/common'
import { z } from 'zod'
import { PrismaService } from '../prisma/prisma.service'

const AddBody = z.object({ recipeId: z.string().min(1) })

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateFavorites(userId: string) {
    let fav = await this.prisma.favorites.findUnique({ where: { userId } })
    if (!fav) {
      fav = await this.prisma.favorites.create({
        data: { userId, recipeIds: [] },
      })
    }
    return fav
  }

  async listRecipeIds(userId: string) {
    const fav = await this.getOrCreateFavorites(userId)
    return { recipeIds: fav.recipeIds }
  }

  async add(userId: string, body: unknown) {
    const parsed = AddBody.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Validation failed', details: parsed.error.flatten() })
    }
    const fav = await this.getOrCreateFavorites(userId)
    const recipeId = parsed.data.recipeId
    const recipeIds = fav.recipeIds.includes(recipeId) ? fav.recipeIds : [...fav.recipeIds, recipeId]
    return this.prisma.favorites.update({
      where: { userId: fav.userId },
      data: { recipeIds },
    })
  }

  async remove(userId: string, recipeId: string) {
    const fav = await this.getOrCreateFavorites(userId)
    const recipeIds = fav.recipeIds.filter((id) => id !== recipeId)
    return this.prisma.favorites.update({
      where: { userId: fav.userId },
      data: { recipeIds },
    })
  }

  async isFavorite(userId: string, recipeId: string) {
    const fav = await this.getOrCreateFavorites(userId)
    return { isFavorite: fav.recipeIds.includes(recipeId) }
  }
}
