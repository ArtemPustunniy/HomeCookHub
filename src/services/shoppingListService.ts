import { type ShoppingList, type ShoppingListItem } from '@/types'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage'
import { nanoid } from 'nanoid'
import { getAllRecipes } from './recipeService'
import { isGraphQLEnabled, graphqlRequest } from '@/lib/graphqlClient'
import {
  SHOPPING_LIST_QUERY,
  GENERATE_SHOPPING_LIST_MUTATION,
  ADD_SHOPPING_LIST_ITEM_MUTATION,
  UPDATE_SHOPPING_LIST_ITEM_MUTATION,
  DELETE_SHOPPING_LIST_ITEM_MUTATION,
  TOGGLE_SHOPPING_LIST_ITEM_PURCHASED_MUTATION,
  CLEAR_SHOPPING_LIST_MUTATION,
} from '@/graphql/operations'

export function getShoppingList(): Promise<ShoppingList> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ shoppingList: ShoppingList }>(SHOPPING_LIST_QUERY).then((d) => d.shoppingList)
  }
  const list = getStorageItem<ShoppingList | null>(STORAGE_KEYS.SHOPPING_LIST, null)
  if (list) return Promise.resolve(list)
  const newList: ShoppingList = {
    id: nanoid(),
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  setStorageItem(STORAGE_KEYS.SHOPPING_LIST, newList)
  return Promise.resolve(newList)
}

export function generateShoppingListFromPlanner(recipeIds: string[]): Promise<ShoppingList> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ generateShoppingList: ShoppingList }>(GENERATE_SHOPPING_LIST_MUTATION, {
      recipeIds,
    }).then((d) => d.generateShoppingList)
  }
  return getAllRecipes().then((recipes) => {
    const selectedRecipes = recipes.filter((r) => recipeIds.includes(r.id))
    const ingredientMap = new Map<string, { amount?: number; unit?: string }>()
    selectedRecipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const key = ingredient.name.toLowerCase().trim()
        const existing = ingredientMap.get(key)
        if (existing) {
          if (existing.unit === ingredient.unit && existing.amount && ingredient.amount) {
            existing.amount += ingredient.amount
          } else {
            ingredientMap.set(`${key}_${nanoid()}`, { amount: ingredient.amount, unit: ingredient.unit })
          }
        } else {
          ingredientMap.set(key, { amount: ingredient.amount, unit: ingredient.unit })
        }
      })
    })
    const items: ShoppingListItem[] = Array.from(ingredientMap.entries()).map(([name, data]) => ({
      id: nanoid(),
      name: name.split('_')[0],
      amount: data.amount,
      unit: data.unit,
      purchased: false,
    }))
    const list = getStorageItem<ShoppingList | null>(STORAGE_KEYS.SHOPPING_LIST, null) ?? {
      id: nanoid(),
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    list.items = items
    list.updatedAt = new Date().toISOString()
    setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
    return list
  })
}

export function addShoppingListItem(item: Omit<ShoppingListItem, 'id'>): Promise<ShoppingList> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ addShoppingListItem: ShoppingList }>(ADD_SHOPPING_LIST_ITEM_MUTATION, {
      name: item.name,
      amount: item.amount,
      unit: item.unit,
    }).then((d) => d.addShoppingListItem)
  }
  return getShoppingList().then((list) => {
    list.items.push({ ...item, id: nanoid() })
    list.updatedAt = new Date().toISOString()
    setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
    return list
  })
}

export function updateShoppingListItem(
  itemId: string,
  updates: Partial<ShoppingListItem>,
): Promise<ShoppingList | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ updateShoppingListItem: ShoppingList }>(UPDATE_SHOPPING_LIST_ITEM_MUTATION, {
      itemId,
      ...updates,
    }).then((d) => d.updateShoppingListItem)
  }
  return getShoppingList().then((list) => {
    const index = list.items.findIndex((item) => item.id === itemId)
    if (index === -1) return null
    list.items[index] = { ...list.items[index], ...updates }
    list.updatedAt = new Date().toISOString()
    setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
    return list
  })
}

export function deleteShoppingListItem(itemId: string): Promise<ShoppingList | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ deleteShoppingListItem: ShoppingList }>(DELETE_SHOPPING_LIST_ITEM_MUTATION, {
      itemId,
    }).then((d) => d.deleteShoppingListItem)
  }
  return getShoppingList().then((list) => {
    const filtered = list.items.filter((item) => item.id !== itemId)
    if (filtered.length === list.items.length) return null
    list.items = filtered
    list.updatedAt = new Date().toISOString()
    setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
    return list
  })
}

export function togglePurchased(itemId: string): Promise<ShoppingList | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ toggleShoppingListItemPurchased: ShoppingList }>(
      TOGGLE_SHOPPING_LIST_ITEM_PURCHASED_MUTATION,
      { itemId },
    ).then((d) => d.toggleShoppingListItemPurchased)
  }
  return getShoppingList().then((list) => {
    const item = list.items.find((i) => i.id === itemId)
    if (!item) return null
    item.purchased = !item.purchased
    list.updatedAt = new Date().toISOString()
    setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
    return list
  })
}

export function clearShoppingList(): Promise<ShoppingList> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ clearShoppingList: ShoppingList }>(CLEAR_SHOPPING_LIST_MUTATION).then(
      (d) => d.clearShoppingList,
    )
  }
  return getShoppingList().then((list) => {
    list.items = []
    list.updatedAt = new Date().toISOString()
    setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
    return list
  })
}
