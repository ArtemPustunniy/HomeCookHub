import { Injectable } from '@nestjs/common'
import type { JwtUser } from '../auth/jwt.strategy'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BffService {
  constructor(private prisma: PrismaService) {}

  async home(user: JwtUser) {
    const userId = user.userId
    const [latestRecipes, favorites, planner] = await Promise.all([
      this.prisma.recipe.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.prisma.favorites.findUnique({ where: { userId } }),
      this.prisma.planner.findFirst({
        where: { userId },
        orderBy: { weekStart: 'desc' },
        include: { days: { orderBy: { dayIndex: 'asc' } } },
      }),
    ])

    return {
      user: {
        id: user.userId,
        name: user.name,
        role: user.role ?? 'user',
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
    }
  }
}
