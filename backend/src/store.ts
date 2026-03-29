import type { Recipe, Planner, ShoppingList, Favorites, User } from './types.js'
import { addDays, format, startOfWeek } from 'date-fns'
import { nanoid } from 'nanoid'

const recipes = new Map<string, Recipe>()
const users = new Map<string, User>()
const planners = new Map<string, Planner>() // key: userId_weekStart
const shoppingLists = new Map<string, ShoppingList>() // key: userId
const favoritesMap = new Map<string, Favorites>() // key: userId

export const store = {
  recipes: {
    getAll: (): Recipe[] => Array.from(recipes.values()),
    getById: (id: string): Recipe | undefined => recipes.get(id),
    set: (r: Recipe) => { recipes.set(r.id, r) },
    delete: (id: string) => recipes.delete(id),
  },
  users: {
    getById: (id: string): User | undefined => users.get(id),
    getByName: (name: string): User | undefined =>
      Array.from(users.values()).find((u) => u.name === name),
    set: (u: User) => { users.set(u.id, u) },
  },
  planners: {
    key: (userId: string, weekStart: string) => `${userId}_${weekStart}`,
    get: (userId: string, weekStart: string): Planner | undefined =>
      planners.get(store.planners.key(userId, weekStart)),
    set: (userId: string, p: Planner) => {
      planners.set(store.planners.key(userId, p.weekStart), p)
    },
  },
  shoppingLists: {
    get: (userId: string): ShoppingList | undefined => shoppingLists.get(userId),
    set: (userId: string, list: ShoppingList) => { shoppingLists.set(userId, list) },
  },
  favorites: {
    get: (userId: string): Favorites | undefined => favoritesMap.get(userId),
    set: (f: Favorites) => { favoritesMap.set(f.userId, f) },
  },
}

export function createEmptyPlanner(weekStart: string): Planner {
  const start = new Date(weekStart)
  const days = Array.from({ length: 7 }, (_, i) => ({
    date: format(addDays(start, i), 'yyyy-MM-dd'),
    recipeIds: [] as string[],
  }))
  return { weekStart, days }
}

export function getWeekStart(date?: Date): string {
  const d = date ?? new Date()
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function createId(): string {
  return nanoid()
}

export function now(): string {
  return new Date().toISOString()
}
