// Storage keys
export const STORAGE_KEYS = {
  RECIPES: 'homecookhub_recipes',
  PLANNER: 'homecookhub_planner',
  SHOPPING_LIST: 'homecookhub_shopping_list',
  FAVORITES: 'homecookhub_favorites',
  THEME: 'homecookhub_theme',
  CURRENT_USER: 'homecookhub_current_user',
} as const

// Generic storage helpers
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error)
  }
}

