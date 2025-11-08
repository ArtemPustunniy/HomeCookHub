import { type Favorites } from '@/types'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage'

// Get user favorites
export function getFavorites(userId: string): Favorites {
  const allFavorites = getStorageItem<Favorites[]>(STORAGE_KEYS.FAVORITES, [])
  const favorites = allFavorites.find((f) => f.userId === userId)
  
  if (favorites) return favorites
  
  const newFavorites: Favorites = {
    userId,
    recipeIds: [],
  }
  
  allFavorites.push(newFavorites)
  setStorageItem(STORAGE_KEYS.FAVORITES, allFavorites)
  return newFavorites
}

// Add to favorites
export function addToFavorites(userId: string, recipeId: string): Favorites {
  const favorites = getFavorites(userId)
  
  if (!favorites.recipeIds.includes(recipeId)) {
    favorites.recipeIds.push(recipeId)
    
    const allFavorites = getStorageItem<Favorites[]>(STORAGE_KEYS.FAVORITES, [])
    const index = allFavorites.findIndex((f) => f.userId === userId)
    
    if (index >= 0) {
      allFavorites[index] = favorites
    } else {
      allFavorites.push(favorites)
    }
    
    setStorageItem(STORAGE_KEYS.FAVORITES, allFavorites)
  }
  
  return favorites
}

// Remove from favorites
export function removeFromFavorites(userId: string, recipeId: string): Favorites {
  const favorites = getFavorites(userId)
  favorites.recipeIds = favorites.recipeIds.filter((id) => id !== recipeId)
  
  const allFavorites = getStorageItem<Favorites[]>(STORAGE_KEYS.FAVORITES, [])
  const index = allFavorites.findIndex((f) => f.userId === userId)
  
  if (index >= 0) {
    allFavorites[index] = favorites
  }
  
  setStorageItem(STORAGE_KEYS.FAVORITES, allFavorites)
  return favorites
}

// Check if recipe is in favorites
export function isFavorite(userId: string, recipeId: string): boolean {
  const favorites = getFavorites(userId)
  return favorites.recipeIds.includes(recipeId)
}

// Toggle favorite
export function toggleFavorite(userId: string, recipeId: string): Favorites {
  if (isFavorite(userId, recipeId)) {
    return removeFromFavorites(userId, recipeId)
  } else {
    return addToFavorites(userId, recipeId)
  }
}

