import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getShoppingList,
  generateShoppingListFromPlanner,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  togglePurchased,
  clearShoppingList,
} from '@/services/shoppingListService'
import { type ShoppingListItem } from '@/types'

export const shoppingListKeys = {
  all: ['shopping-list'] as const,
  current: () => [...shoppingListKeys.all, 'current'] as const,
}

export function useShoppingList() {
  return useQuery({
    queryKey: shoppingListKeys.current(),
    queryFn: () => getShoppingList(),
  })
}

export function useGenerateShoppingListFromPlanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipeIds: string[]) => generateShoppingListFromPlanner(recipeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.current() })
    },
  })
}

export function useAddShoppingListItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (item: Omit<ShoppingListItem, 'id'>) => addShoppingListItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.current() })
    },
  })
}

export function useUpdateShoppingListItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<ShoppingListItem> }) =>
      updateShoppingListItem(itemId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.current() })
    },
  })
}

export function useDeleteShoppingListItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => deleteShoppingListItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.current() })
    },
  })
}

export function useTogglePurchased() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => togglePurchased(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.current() })
    },
  })
}

export function useClearShoppingList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => clearShoppingList(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.current() })
    },
  })
}

