import { type ShoppingList, type ShoppingListItem } from '@/types'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage'
import { nanoid } from 'nanoid'
import { getAllRecipes } from './recipeService'

// Get current shopping list
export function getShoppingList(): ShoppingList {
  const list = getStorageItem<ShoppingList | null>(STORAGE_KEYS.SHOPPING_LIST, null)
  
  if (list) return list
  
  const newList: ShoppingList = {
    id: nanoid(),
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  setStorageItem(STORAGE_KEYS.SHOPPING_LIST, newList)
  return newList
}

// Generate shopping list from planner recipes
export function generateShoppingListFromPlanner(recipeIds: string[]): ShoppingList {
  const recipes = getAllRecipes()
  const selectedRecipes = recipes.filter((r) => recipeIds.includes(r.id))
  
  // Aggregate ingredients
  const ingredientMap = new Map<string, { amount?: number; unit?: string }>()
  
  selectedRecipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const key = ingredient.name.toLowerCase().trim()
      const existing = ingredientMap.get(key)
      
      if (existing) {
        // Merge amounts if units match
        if (existing.unit === ingredient.unit && existing.amount && ingredient.amount) {
          existing.amount += ingredient.amount
        } else {
          // Keep separate if units differ or one has no amount
          ingredientMap.set(`${key}_${nanoid()}`, {
            amount: ingredient.amount,
            unit: ingredient.unit,
          })
        }
      } else {
        ingredientMap.set(key, {
          amount: ingredient.amount,
          unit: ingredient.unit,
        })
      }
    })
  })
  
  // Convert to shopping list items
  const items: ShoppingListItem[] = Array.from(ingredientMap.entries()).map(([name, data]) => ({
    id: nanoid(),
    name: name.split('_')[0], // Remove suffix if added
    amount: data.amount,
    unit: data.unit,
    purchased: false,
  }))
  
  const list = getShoppingList()
  list.items = items
  list.updatedAt = new Date().toISOString()
  
  setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
  return list
}

// Add item to shopping list
export function addShoppingListItem(item: Omit<ShoppingListItem, 'id'>): ShoppingList {
  const list = getShoppingList()
  
  list.items.push({
    ...item,
    id: nanoid(),
  })
  
  list.updatedAt = new Date().toISOString()
  setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
  return list
}

// Update shopping list item
export function updateShoppingListItem(itemId: string, updates: Partial<ShoppingListItem>): ShoppingList | null {
  const list = getShoppingList()
  const index = list.items.findIndex((item) => item.id === itemId)
  
  if (index === -1) return null
  
  list.items[index] = { ...list.items[index], ...updates }
  list.updatedAt = new Date().toISOString()
  setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
  return list
}

// Delete shopping list item
export function deleteShoppingListItem(itemId: string): ShoppingList | null {
  const list = getShoppingList()
  const filtered = list.items.filter((item) => item.id !== itemId)
  
  if (filtered.length === list.items.length) return null
  
  list.items = filtered
  list.updatedAt = new Date().toISOString()
  setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
  return list
}

// Toggle purchased status
export function togglePurchased(itemId: string): ShoppingList | null {
  const list = getShoppingList()
  const item = list.items.find((item) => item.id === itemId)
  
  if (!item) return null
  
  item.purchased = !item.purchased
  list.updatedAt = new Date().toISOString()
  setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
  return list
}

// Clear shopping list
export function clearShoppingList(): ShoppingList {
  const list = getShoppingList()
  list.items = []
  list.updatedAt = new Date().toISOString()
  setStorageItem(STORAGE_KEYS.SHOPPING_LIST, list)
  return list
}

