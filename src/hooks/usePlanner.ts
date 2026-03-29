import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCurrentWeekPlanner,
  getPlannerForWeek,
  addRecipeToDay,
  removeRecipeFromDay,
  moveRecipe,
  clearDay,
  clearWeek,
} from '@/services/plannerService'

export const plannerKeys = {
  all: ['planner'] as const,
  current: () => [...plannerKeys.all, 'current'] as const,
  week: (weekStart: string) => [...plannerKeys.all, 'week', weekStart] as const,
}

export function useCurrentWeekPlanner() {
  return useQuery({
    queryKey: plannerKeys.current(),
    queryFn: () => getCurrentWeekPlanner(),
  })
}

export function usePlannerForWeek(weekStart: string) {
  return useQuery({
    queryKey: plannerKeys.week(weekStart),
    queryFn: () => getPlannerForWeek(weekStart),
  })
}

export function useAddRecipeToDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      weekStart,
      dayIndex,
      recipeId,
    }: {
      weekStart: string
      dayIndex: number
      recipeId: string
    }) => addRecipeToDay(weekStart, dayIndex, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.current() })
      queryClient.invalidateQueries({ queryKey: plannerKeys.week(variables.weekStart) })
    },
  })
}

export function useRemoveRecipeFromDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      weekStart,
      dayIndex,
      recipeId,
    }: {
      weekStart: string
      dayIndex: number
      recipeId: string
    }) => removeRecipeFromDay(weekStart, dayIndex, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.current() })
      queryClient.invalidateQueries({ queryKey: plannerKeys.week(variables.weekStart) })
    },
  })
}

export function useMoveRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      weekStart,
      fromDayIndex,
      toDayIndex,
      recipeId,
    }: {
      weekStart: string
      fromDayIndex: number
      toDayIndex: number
      recipeId: string
    }) => moveRecipe(weekStart, fromDayIndex, toDayIndex, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.current() })
      queryClient.invalidateQueries({ queryKey: plannerKeys.week(variables.weekStart) })
    },
  })
}

export function useClearDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ weekStart, dayIndex }: { weekStart: string; dayIndex: number }) =>
      clearDay(weekStart, dayIndex),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.current() })
      queryClient.invalidateQueries({ queryKey: plannerKeys.week(variables.weekStart) })
    },
  })
}

export function useClearWeek() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (weekStart: string) => clearWeek(weekStart),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.current() })
      queryClient.invalidateQueries({ queryKey: plannerKeys.week(variables) })
    },
  })
}

