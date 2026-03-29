import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFavorites, addToFavorites, removeFromFavorites, toggleFavorite, isFavorite } from '@/services/favoritesService'
import { recipeKeys } from './useRecipes'

export const favoritesKeys = {
  all: ['favorites'] as const,
  user: (userId: string) => [...favoritesKeys.all, userId] as const,
  check: (userId: string, recipeId: string) => [...favoritesKeys.user(userId), 'check', recipeId] as const,
}

export function useFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: favoritesKeys.user(userId || ''),
    queryFn: () => (userId ? getFavorites(userId) : null),
    enabled: !!userId,
  })
}

export function useIsFavorite(userId: string | undefined, recipeId: string | undefined) {
  return useQuery({
    queryKey: favoritesKeys.check(userId || '', recipeId || ''),
    queryFn: () => (userId && recipeId ? isFavorite(userId, recipeId) : Promise.resolve(false)),
    enabled: !!userId && !!recipeId,
  })
}

export function useAddToFavorites() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, recipeId }: { userId: string; recipeId: string }) => addToFavorites(userId, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: favoritesKeys.user(variables.userId) })
      queryClient.invalidateQueries({ queryKey: favoritesKeys.check(variables.userId, variables.recipeId) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
    },
  })
}

export function useRemoveFromFavorites() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, recipeId }: { userId: string; recipeId: string }) => removeFromFavorites(userId, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: favoritesKeys.user(variables.userId) })
      queryClient.invalidateQueries({ queryKey: favoritesKeys.check(variables.userId, variables.recipeId) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, recipeId }: { userId: string; recipeId: string }) => toggleFavorite(userId, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: favoritesKeys.user(variables.userId) })
      queryClient.invalidateQueries({ queryKey: favoritesKeys.check(variables.userId, variables.recipeId) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
    },
  })
}

