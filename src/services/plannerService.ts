import { type Planner, type PlannerDay } from '@/types'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage'
import { startOfWeek, addDays, format, parseISO } from 'date-fns'

// Get planner for a specific week
export function getPlannerForWeek(weekStart: string): Planner {
  const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
  const planner = planners.find((p) => p.weekStart === weekStart)
  
  if (planner) return planner
  
  // Create new planner for the week
  const weekStartDate = parseISO(weekStart)
  const days: PlannerDay[] = []
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStartDate, i)
    days.push({
      date: format(date, 'yyyy-MM-dd'),
      recipeIds: [],
    })
  }
  
  const newPlanner: Planner = {
    weekStart,
    days,
  }
  
  planners.push(newPlanner)
  setStorageItem(STORAGE_KEYS.PLANNER, planners)
  return newPlanner
}

// Get current week planner
export function getCurrentWeekPlanner(): Planner {
  const today = new Date()
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  return getPlannerForWeek(weekStart)
}

// Add recipe to day
export function addRecipeToDay(weekStart: string, dayIndex: number, recipeId: string): Planner | null {
  const planner = getPlannerForWeek(weekStart)
  
  if (dayIndex < 0 || dayIndex >= 7) return null
  if (planner.days[dayIndex].recipeIds.includes(recipeId)) return planner
  
  planner.days[dayIndex].recipeIds.push(recipeId)
  
  const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
  const index = planners.findIndex((p) => p.weekStart === weekStart)
  
  if (index >= 0) {
    planners[index] = planner
  } else {
    planners.push(planner)
  }
  
  setStorageItem(STORAGE_KEYS.PLANNER, planners)
  return planner
}

// Remove recipe from day
export function removeRecipeFromDay(weekStart: string, dayIndex: number, recipeId: string): Planner | null {
  const planner = getPlannerForWeek(weekStart)
  
  if (dayIndex < 0 || dayIndex >= 7) return null
  
  planner.days[dayIndex].recipeIds = planner.days[dayIndex].recipeIds.filter((id) => id !== recipeId)
  
  const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
  const index = planners.findIndex((p) => p.weekStart === weekStart)
  
  if (index >= 0) {
    planners[index] = planner
  }
  
  setStorageItem(STORAGE_KEYS.PLANNER, planners)
  return planner
}

// Move recipe between days
export function moveRecipe(weekStart: string, fromDayIndex: number, toDayIndex: number, recipeId: string): Planner | null {
  const planner = getPlannerForWeek(weekStart)
  
  if (fromDayIndex < 0 || fromDayIndex >= 7 || toDayIndex < 0 || toDayIndex >= 7) return null
  
  // Remove from source day
  planner.days[fromDayIndex].recipeIds = planner.days[fromDayIndex].recipeIds.filter((id) => id !== recipeId)
  
  // Add to target day (if not already there)
  if (!planner.days[toDayIndex].recipeIds.includes(recipeId)) {
    planner.days[toDayIndex].recipeIds.push(recipeId)
  }
  
  const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
  const index = planners.findIndex((p) => p.weekStart === weekStart)
  
  if (index >= 0) {
    planners[index] = planner
  }
  
  setStorageItem(STORAGE_KEYS.PLANNER, planners)
  return planner
}

// Clear day
export function clearDay(weekStart: string, dayIndex: number): Planner | null {
  const planner = getPlannerForWeek(weekStart)
  
  if (dayIndex < 0 || dayIndex >= 7) return null
  
  planner.days[dayIndex].recipeIds = []
  
  const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
  const index = planners.findIndex((p) => p.weekStart === weekStart)
  
  if (index >= 0) {
    planners[index] = planner
  }
  
  setStorageItem(STORAGE_KEYS.PLANNER, planners)
  return planner
}

// Clear week
export function clearWeek(weekStart: string): Planner | null {
  const planner = getPlannerForWeek(weekStart)
  
  planner.days.forEach((day) => {
    day.recipeIds = []
  })
  
  const planners = getStorageItem<Planner[]>(STORAGE_KEYS.PLANNER, [])
  const index = planners.findIndex((p) => p.weekStart === weekStart)
  
  if (index >= 0) {
    planners[index] = planner
  }
  
  setStorageItem(STORAGE_KEYS.PLANNER, planners)
  return planner
}

