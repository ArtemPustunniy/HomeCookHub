import { Router } from 'express'
import { z } from 'zod'
import { addDays, format, parseISO } from 'date-fns'
import { prisma } from '../db.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

function normalizeWeekStart(weekStart?: string): string {
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

async function getOrCreatePlanner(userId: string, weekStartParam?: string) {
  const weekStart = normalizeWeekStart(weekStartParam)

  let planner = await prisma.planner.findUnique({
    where: {
      userId_weekStart: {
        userId,
        weekStart,
      },
    },
    include: { days: { orderBy: { dayIndex: 'asc' } } },
  })

  if (!planner) {
    const monday = parseISO(weekStart)
    const daysData = Array.from({ length: 7 }, (_, i) => ({
      dayIndex: i,
      date: format(addDays(monday, i), 'yyyy-MM-dd'),
      recipeIds: [] as string[],
    }))

    planner = await prisma.planner.create({
      data: {
        userId,
        weekStart,
        days: {
          create: daysData,
        },
      },
      include: { days: { orderBy: { dayIndex: 'asc' } } },
    })
  }

  return planner
}

// GET /planner?weekStart=
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const weekStart = (req.query.weekStart as string | undefined) || undefined
  const planner = await getOrCreatePlanner(req.user!.userId, weekStart)

  res.json({
    weekStart: planner.weekStart,
    days: planner.days.map((d) => ({
      date: d.date,
      recipeIds: d.recipeIds,
    })),
  })
})

const AddRecipeBody = z.object({ recipeId: z.string().min(1) })

// POST /planner/days/:dayIndex/recipes?weekStart=
router.post(
  '/days/:dayIndex/recipes',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const dayIndex = parseInt(req.params.dayIndex, 10)
    if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      res.status(400).json({ error: 'dayIndex must be 0..6' })
      return
    }

    const parsed = AddRecipeBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
      return
    }

    const weekStart = (req.query.weekStart as string | undefined) || undefined
    const planner = await getOrCreatePlanner(req.user!.userId, weekStart)
    const day = planner.days.find((d) => d.dayIndex === dayIndex)
    if (!day) {
      res.status(400).json({ error: 'Invalid dayIndex' })
      return
    }

    const recipeIds = day.recipeIds.includes(parsed.data.recipeId)
      ? day.recipeIds
      : [...day.recipeIds, parsed.data.recipeId]

    await prisma.plannerDay.update({
      where: {
        plannerId_dayIndex: {
          plannerId: planner.id,
          dayIndex,
        },
      },
      data: { recipeIds },
    })

    const updated = await getOrCreatePlanner(req.user!.userId, planner.weekStart)
    res.json({
      weekStart: updated.weekStart,
      days: updated.days.map((d) => ({
        date: d.date,
        recipeIds: d.recipeIds,
      })),
    })
  },
)

// DELETE /planner/days/:dayIndex/recipes/:recipeId?weekStart=
router.delete(
  '/days/:dayIndex/recipes/:recipeId',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const dayIndex = parseInt(req.params.dayIndex, 10)
    if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      res.status(400).json({ error: 'dayIndex must be 0..6' })
      return
    }
    const recipeId = req.params.recipeId
    const weekStart = (req.query.weekStart as string | undefined) || undefined
    const planner = await getOrCreatePlanner(req.user!.userId, weekStart)
    const day = planner.days.find((d) => d.dayIndex === dayIndex)
    if (!day) {
      res.status(400).json({ error: 'Invalid dayIndex' })
      return
    }

    const recipeIds = day.recipeIds.filter((id) => id !== recipeId)
    await prisma.plannerDay.update({
      where: {
        plannerId_dayIndex: {
          plannerId: planner.id,
          dayIndex,
        },
      },
      data: { recipeIds },
    })

    const updated = await getOrCreatePlanner(req.user!.userId, planner.weekStart)
    res.json({
      weekStart: updated.weekStart,
      days: updated.days.map((d) => ({
        date: d.date,
        recipeIds: d.recipeIds,
      })),
    })
  },
)

const MoveBody = z.object({
  weekStart: z.string(),
  fromDayIndex: z.number().min(0).max(6),
  toDayIndex: z.number().min(0).max(6),
})

// PATCH /planner/recipes/:recipeId/move
router.patch('/recipes/:recipeId/move', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = MoveBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    return
  }

  const { weekStart, fromDayIndex, toDayIndex } = parsed.data
  const recipeId = req.params.recipeId

  const planner = await getOrCreatePlanner(req.user!.userId, weekStart)
  const fromDay = planner.days.find((d) => d.dayIndex === fromDayIndex)
  const toDay = planner.days.find((d) => d.dayIndex === toDayIndex)

  if (!fromDay || !toDay) {
    res.status(400).json({ error: 'Invalid fromDayIndex/toDayIndex' })
    return
  }

  if (!fromDay.recipeIds.includes(recipeId)) {
    res.status(404).json({ error: 'Recipe not found in source day' })
    return
  }

  const newFromIds = fromDay.recipeIds.filter((id) => id !== recipeId)
  const newToIds = toDay.recipeIds.includes(recipeId)
    ? toDay.recipeIds
    : [...toDay.recipeIds, recipeId]

  await prisma.$transaction([
    prisma.plannerDay.update({
      where: {
        plannerId_dayIndex: { plannerId: planner.id, dayIndex: fromDayIndex },
      },
      data: { recipeIds: newFromIds },
    }),
    prisma.plannerDay.update({
      where: {
        plannerId_dayIndex: { plannerId: planner.id, dayIndex: toDayIndex },
      },
      data: { recipeIds: newToIds },
    }),
  ])

  const updated = await getOrCreatePlanner(req.user!.userId, planner.weekStart)
  res.json({
    weekStart: updated.weekStart,
    days: updated.days.map((d) => ({
      date: d.date,
      recipeIds: d.recipeIds,
    })),
  })
})

// DELETE /planner/days/:dayIndex?weekStart=
router.delete('/days/:dayIndex', requireAuth, async (req: AuthenticatedRequest, res) => {
  const dayIndex = parseInt(req.params.dayIndex, 10)
  if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
    res.status(400).json({ error: 'dayIndex must be 0..6' })
    return
  }
  const weekStart = (req.query.weekStart as string | undefined) || undefined
  const planner = await getOrCreatePlanner(req.user!.userId, weekStart)

  await prisma.plannerDay.update({
    where: {
      plannerId_dayIndex: {
        plannerId: planner.id,
        dayIndex,
      },
    },
    data: { recipeIds: [] },
  })

  const updated = await getOrCreatePlanner(req.user!.userId, planner.weekStart)
  res.json({
    weekStart: updated.weekStart,
    days: updated.days.map((d) => ({
      date: d.date,
      recipeIds: d.recipeIds,
    })),
  })
})

// DELETE /planner/week?weekStart=
router.delete('/week', requireAuth, async (req: AuthenticatedRequest, res) => {
  const weekStart = (req.query.weekStart as string | undefined) || undefined
  const planner = await getOrCreatePlanner(req.user!.userId, weekStart)

  await prisma.plannerDay.updateMany({
    where: { plannerId: planner.id },
    data: { recipeIds: [] },
  })

  const updated = await getOrCreatePlanner(req.user!.userId, planner.weekStart)
  res.json({
    weekStart: updated.weekStart,
    days: updated.days.map((d) => ({
      date: d.date,
      recipeIds: d.recipeIds,
    })),
  })
})

export default router

