import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { nanoid } from 'nanoid'
import { PrismaService } from '../prisma/prisma.service'
import { RecipesService } from '../recipes/recipes.service'
import type { RecipesMvcFormDto } from './dto/recipes-mvc-form.dto'

export type RecipeRowView = {
  id: string
  title: string
  cuisine: string
  cookingTime: number
  difficulty: string
  authorId: string
  authorName: string
  createdAt: string
}

@Injectable()
export class RecipesMvcService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipes: RecipesService,
    private readonly config: ConfigService,
  ) {}

  /** Пользователь, от имени которого MVC создаёт/редактирует рецепты. */
  async getMvcActorUserId(): Promise<string> {
    return this.resolveMvcUserId()
  }

  private async resolveMvcUserId(): Promise<string> {
    const email = this.config.get<string>('MVC_DEMO_USER_EMAIL')
    const user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!user) {
      throw new BadRequestException(
        'Нет пользователя для MVC: создайте пользователя через POST /auth/register или задайте MVC_DEMO_USER_EMAIL в .env',
      )
    }
    return user.id
  }

  private async resolveMvcUserName(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({ where: { id: userId } })
    return u?.name ?? 'User'
  }

  async listRows(): Promise<RecipeRowView[]> {
    const rows = await this.prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: {
        id: true,
        title: true,
        cuisine: true,
        cookingTime: true,
        difficulty: true,
        authorId: true,
        authorName: true,
        createdAt: true,
      },
    })
    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  }

  async findRow(id: string): Promise<RecipeRowView | null> {
    const r = await this.prisma.recipe.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        cuisine: true,
        cookingTime: true,
        difficulty: true,
        authorId: true,
        authorName: true,
        createdAt: true,
      },
    })
    if (!r) return null
    return { ...r, createdAt: r.createdAt.toISOString() }
  }

  private toRecipeBody(dto: RecipesMvcFormDto, authorId: string, authorName: string) {
    const instructions = dto.instructions
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (instructions.length === 0) {
      throw new BadRequestException('Нужен хотя бы один шаг в поле instructions (строки)')
    }
    return {
      title: dto.title,
      cookingTime: dto.cookingTime,
      difficulty: dto.difficulty,
      cuisine: dto.cuisine,
      tags: [] as string[],
      coverImage: dto.coverImage?.trim() || '',
      ingredients: [{ id: nanoid(), name: dto.ingredientName.trim(), amount: 1 }],
      instructions,
      nutrition: undefined,
      authorId,
      authorName,
    }
  }

  async createRecipe(dto: RecipesMvcFormDto): Promise<string> {
    const userId = await this.resolveMvcUserId()
    const name = await this.resolveMvcUserName(userId)
    const body = this.toRecipeBody(dto, userId, name)
    const r = await this.recipes.create(body, userId, name)
    if (typeof r === 'object' && r && 'ok' in r && (r as { ok: boolean }).ok === false) {
      throw new BadRequestException({ error: 'Validation failed', details: (r as { details: unknown }).details })
    }
    return (r as { id: string }).id
  }

  async updateRecipe(id: string, dto: RecipesMvcFormDto): Promise<void> {
    const userId = await this.resolveMvcUserId()
    const existing = await this.prisma.recipe.findUnique({
      where: { id },
      select: { authorId: true, authorName: true },
    })
    if (!existing) throw new NotFoundException('Рецепт не найден')
    const body = this.toRecipeBody(dto, existing.authorId, existing.authorName)
    const r = await this.recipes.update(id, body, userId)
    if (typeof r === 'object' && r && 'ok' in r && (r as { ok: boolean }).ok === false) {
      throw new BadRequestException({ error: 'Validation failed', details: (r as { details: unknown }).details })
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    const userId = await this.resolveMvcUserId()
    await this.recipes.remove(id, userId)
  }

  async assertCanEdit(id: string): Promise<void> {
    const userId = await this.resolveMvcUserId()
    const row = await this.prisma.recipe.findUnique({ where: { id }, select: { authorId: true } })
    if (!row) throw new NotFoundException('Рецепт не найден')
    if (row.authorId !== userId) {
      throw new ForbiddenException('Редактировать может только автор (текущий MVC-пользователь)')
    }
  }

  async getRecipeForForm(id: string) {
    const full = await this.prisma.recipe.findUnique({ where: { id } })
    if (!full) throw new NotFoundException('Рецепт не найден')
    const ingredients = (full.ingredients as { name?: string }[]) ?? []
    const ing = ingredients[0]?.name ?? ''
    const instr = Array.isArray(full.instructions) ? (full.instructions as string[]).join('\n') : ''
    return {
      id,
      title: full.title,
      cookingTime: full.cookingTime,
      difficulty: full.difficulty,
      cuisine: full.cuisine,
      ingredientName: ing,
      instructions: instr,
      coverImage: full.coverImage ?? '',
    }
  }
}
