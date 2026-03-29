import { type Planner, type PlannerDay } from '@/types'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage'
import { startOfWeek, addDays, format, parseISO } from 'date-fns'
import { isGraphQLEnabled, graphqlRequest } from '@/lib/graphqlClient'
import {
  PLANNER_QUERY,
  ADD_RECIPE_TO_PLANNER_MUTATION,
  REMOVE_RECIPE_FROM_PLANNER_MUTATION,
  MOVE_RECIPE_IN_PLANNER_MUTATION,
  CLEAR_PLANNER_DAY_MUTATION,
  CLEAR_PLANNER_WEEK_MUTATION,
} from '@/graphql/operations'

export function getPlannerForWeek(weekStart: string): Promise<Planner> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ planner: Planner }>(PLANNER_QUERY, { weekStart }).then((d) => d.planner)
  }
  const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
  const planner = planners.find((p) => p.weekStart === weekStart)
  if (planner) return Promise.resolve(planner)
  const weekStartDate = parseISO(weekStart)
  const days: PlannerDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStartDate, i)
    days.push({ date: format(date, 'yyyy-MM-dd'), recipeIds: [] })
  }
  const newPlanner: Planner = { weekStart, days }
  planners.push(newPlanner)
  setStorageItem(STORAGE_KEYS.PLANNER, planners)
  return Promise.resolve(newPlanner)
}

export function getCurrentWeekPlanner(): Promise<Planner> {
  const today = new Date()
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  return getPlannerForWeek(weekStart)
}

export function addRecipeToDay(
  weekStart: string,
  dayIndex: number,
  recipeId: string,
): Promise<Planner | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ addRecipeToPlanner: Planner }>(ADD_RECIPE_TO_PLANNER_MUTATION, {
      weekStart,
      dayIndex,
      recipeId,
    }).then((d) => d.addRecipeToPlanner)
  }
  return getPlannerForWeek(weekStart).then((planner) => {
    if (dayIndex < 0 || dayIndex >= 7) return null
    if (planner.days[dayIndex].recipeIds.includes(recipeId)) return planner
    planner.days[dayIndex].recipeIds.push(recipeId)
    const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
    const index = planners.findIndex((p) => p.weekStart === weekStart)
    if (index >= 0) planners[index] = planner
    else planners.push(planner)
    setStorageItem(STORAGE_KEYS.PLANNER, planners)
    return planner
  })
}

export function removeRecipeFromDay(
  weekStart: string,
  dayIndex: number,
  recipeId: string,
): Promise<Planner | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ removeRecipeFromPlanner: Planner }>(REMOVE_RECIPE_FROM_PLANNER_MUTATION, {
      weekStart,
      dayIndex,
      recipeId,
    }).then((d) => d.removeRecipeFromPlanner)
  }
  return getPlannerForWeek(weekStart).then((planner) => {
    if (dayIndex < 0 || dayIndex >= 7) return null
    planner.days[dayIndex].recipeIds = planner.days[dayIndex].recipeIds.filter((id) => id !== recipeId)
    const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
    const index = planners.findIndex((p) => p.weekStart === weekStart)
    if (index >= 0) planners[index] = planner
    setStorageItem(STORAGE_KEYS.PLANNER, planners)
    return planner
  })
}

export function moveRecipe(
  weekStart: string,
  fromDayIndex: number,
  toDayIndex: number,
  recipeId: string,
): Promise<Planner | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ moveRecipeInPlanner: Planner }>(MOVE_RECIPE_IN_PLANNER_MUTATION, {
      recipeId,
      weekStart,
      fromDayIndex,
      toDayIndex,
    }).then((d) => d.moveRecipeInPlanner)
  }
  return getPlannerForWeek(weekStart).then((planner) => {
    if (fromDayIndex < 0 || fromDayIndex >= 7 || toDayIndex < 0 || toDayIndex >= 7) return null
    planner.days[fromDayIndex].recipeIds = planner.days[fromDayIndex].recipeIds.filter((id) => id !== recipeId)
    if (!planner.days[toDayIndex].recipeIds.includes(recipeId)) {
      planner.days[toDayIndex].recipeIds.push(recipeId)
    }
    const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
    const index = planners.findIndex((p) => p.weekStart === weekStart)
    if (index >= 0) planners[index] = planner
    setStorageItem(STORAGE_KEYS.PLANNER, planners)
    return planner
  })
}

export function clearDay(weekStart: string, dayIndex: number): Promise<Planner | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ clearPlannerDay: Planner }>(CLEAR_PLANNER_DAY_MUTATION, { weekStart, dayIndex }).then(
      (d) => d.clearPlannerDay,
    )
  }
  return getPlannerForWeek(weekStart).then((planner) => {
    if (dayIndex < 0 || dayIndex >= 7) return null
    planner.days[dayIndex].recipeIds = []
    const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
    const index = planners.findIndex((p) => p.weekStart === weekStart)
    if (index >= 0) planners[index] = planner
    setStorageItem(STORAGE_KEYS.PLANNER, planners)
    return planner
  })
}

export function clearWeek(weekStart: string): Promise<Planner | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ clearPlannerWeek: Planner }>(CLEAR_PLANNER_WEEK_MUTATION, { weekStart }).then(
      (d) => d.clearPlannerWeek,
    )
  }
  return getPlannerForWeek(weekStart).then((planner) => {
    planner.days.forEach((day) => (day.recipeIds = []))
    const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
    const index = planners.findIndex((p) => p.weekStart === weekStart)
    if (index >= 0) planners[index] = planner
    setStorageItem(STORAGE_KEYS.PLANNER, planners)
    return planner
  })
}
