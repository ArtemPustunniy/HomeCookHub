import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  addComment,
  deleteComment,
  setRating,
  getUserRating,
} from '@/services/recipeService'
import { type RecipeForm, type Comment } from '@/types'

export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (filters?: string) => [...recipeKeys.lists(), { filters }] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
}

export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.lists(),
    queryFn: () => getAllRecipes(),
  })
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: recipeKeys.detail(id || ''),
    queryFn: () => (id ? getRecipeById(id) : null),
    enabled: !!id,
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipeForm: RecipeForm) => createRecipe(recipeForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
    },
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, recipeForm }: { id: string; recipeForm: RecipeForm }) => updateRecipe(id, recipeForm),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.id) })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
    },
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      recipeId,
      comment,
    }: {
      recipeId: string
      comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
    }) => addComment(recipeId, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.recipeId) })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      recipeId,
      commentId,
      authorId,
    }: {
      recipeId: string
      commentId: string
      authorId: string
    }) => deleteComment(recipeId, commentId, authorId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.recipeId) })
    },
  })
}

export function useSetRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      recipeId,
      userId,
      rating,
    }: {
      recipeId: string
      userId: string
      rating: number
    }) => setRating(recipeId, userId, rating),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.recipeId) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
    },
  })
}

export function useUserRating(recipeId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['recipe-rating', recipeId, userId],
    queryFn: () => (recipeId && userId ? getUserRating(recipeId, userId) : null),
    enabled: !!recipeId && !!userId,
  })
}

