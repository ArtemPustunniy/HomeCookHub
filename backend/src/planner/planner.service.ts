import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { addDays, format, parseISO } from 'date-fns'
import { z } from 'zod'
import { PrismaService } from '../prisma/prisma.service'

const AddRecipeBody = z.object({ recipeId: z.string().min(1) })
const MoveBody = z.object({
  weekStart: z.string(),
  fromDayIndex: z.number().min(0).max(6),
  toDayIndex: z.number().min(0).max(6),
})

type PlannerWithDays = Prisma.PlannerGetPayload<{ include: { days: true } }>

@Injectable()
export class PlannerService {
  constructor(private prisma: PrismaService) {}

  private normalizeWeekStart(weekStart?: string): string {
    if (!weekStart) {
      const now = new Date()
      const day = now.getDay()
      const diff = (day === 0 ? -6 : 1) - day
      const monday = new Date(now)
      monday.setDate(now.getDate() + diff)
      return format(monday, 'yyyy-MM-dd')
    }
    return weekStart
  }

  async getOrCreatePlanner(userId: string, weekStartParam?: string): Promise<PlannerWithDays> {
    const weekStart = this.normalizeWeekStart(weekStartParam)
    let planner = await this.prisma.planner.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      include: { days: { orderBy: { dayIndex: 'asc' } } },
    })
    if (!planner) {
      const monday = parseISO(weekStart)
      const daysData = Array.from({ length: 7 }, (_, i) => ({
        dayIndex: i,
        date: format(addDays(monday, i), 'yyyy-MM-dd'),
        recipeIds: [] as string[],
      }))
      planner = await this.prisma.planner.create({
        data: { userId, weekStart, days: { create: daysData } },
        include: { days: { orderBy: { dayIndex: 'asc' } } },
      })
    }
    return planner
  }

  private toDto(planner: PlannerWithDays) {
    return {
      weekStart: planner.weekStart,
      days: planner.days.map((d) => ({ date: d.date, recipeIds: d.recipeIds })),
    }
  }

  async get(userId: string, weekStart?: string) {
    const planner = await this.getOrCreatePlanner(userId, weekStart)
    return this.toDto(planner)
  }

  async addRecipe(userId: string, dayIndex: number, body: unknown, weekStart?: string) {
    if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException({ error: 'dayIndex must be 0..6' })
    }
    const parsed = AddRecipeBody.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Validation failed', details: parsed.error.flatten() })
    }
    const planner = await this.getOrCreatePlanner(userId, weekStart)
    const day = planner.days.find((d) => d.dayIndex === dayIndex)
    if (!day) throw new BadRequestException({ error: 'Invalid dayIndex' })
    const recipeIds = day.recipeIds.includes(parsed.data.recipeId)
      ? day.recipeIds
      : [...day.recipeIds, parsed.data.recipeId]
    await this.prisma.plannerDay.update({
      where: { plannerId_dayIndex: { plannerId: planner.id, dayIndex } },
      data: { recipeIds },
    })
    const updated = await this.getOrCreatePlanner(userId, planner.weekStart)
    return this.toDto(updated)
  }

  async removeRecipe(userId: string, dayIndex: number, recipeId: string, weekStart?: string) {
    if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException({ error: 'dayIndex must be 0..6' })
    }
    const planner = await this.getOrCreatePlanner(userId, weekStart)
    const day = planner.days.find((d) => d.dayIndex === dayIndex)
    if (!day) throw new BadRequestException({ error: 'Invalid dayIndex' })
    const recipeIds = day.recipeIds.filter((id) => id !== recipeId)
    await this.prisma.plannerDay.update({
      where: { plannerId_dayIndex: { plannerId: planner.id, dayIndex } },
      data: { recipeIds },
    })
    const updated = await this.getOrCreatePlanner(userId, planner.weekStart)
    return this.toDto(updated)
  }

  async moveRecipe(userId: string, recipeId: string, body: unknown) {
    const parsed = MoveBody.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Validation failed', details: parsed.error.flatten() })
    }
    const { weekStart, fromDayIndex, toDayIndex } = parsed.data
    const planner = await this.getOrCreatePlanner(userId, weekStart)
    const fromDay = planner.days.find((d) => d.dayIndex === fromDayIndex)
    const toDay = planner.days.find((d) => d.dayIndex === toDayIndex)
    if (!fromDay || !toDay) throw new BadRequestException({ error: 'Invalid fromDayIndex/toDayIndex' })
    if (!fromDay.recipeIds.includes(recipeId)) {
      throw new NotFoundException({ error: 'Recipe not found in source day' })
    }
    const newFromIds = fromDay.recipeIds.filter((id) => id !== recipeId)
    const newToIds = toDay.recipeIds.includes(recipeId) ? toDay.recipeIds : [...toDay.recipeIds, recipeId]
    await this.prisma.$transaction([
      this.prisma.plannerDay.update({
        where: { plannerId_dayIndex: { plannerId: planner.id, dayIndex: fromDayIndex } },
        data: { recipeIds: newFromIds },
      }),
      this.prisma.plannerDay.update({
        where: { plannerId_dayIndex: { plannerId: planner.id, dayIndex: toDayIndex } },
        data: { recipeIds: newToIds },
      }),
    ])
    const updated = await this.getOrCreatePlanner(userId, planner.weekStart)
    return this.toDto(updated)
  }

  async clearDay(userId: string, dayIndex: number, weekStart?: string) {
    if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException({ error: 'dayIndex must be 0..6' })
    }
    const planner = await this.getOrCreatePlanner(userId, weekStart)
    await this.prisma.plannerDay.update({
      where: { plannerId_dayIndex: { plannerId: planner.id, dayIndex } },
      data: { recipeIds: [] },
    })
    const updated = await this.getOrCreatePlanner(userId, planner.weekStart)
    return this.toDto(updated)
  }

  async clearWeek(userId: string, weekStart?: string) {
    const planner = await this.getOrCreatePlanner(userId, weekStart)
    await this.prisma.plannerDay.updateMany({
      where: { plannerId: planner.id },
      data: { recipeIds: [] },
    })
    const updated = await this.getOrCreatePlanner(userId, planner.weekStart)
    return this.toDto(updated)
  }
}
