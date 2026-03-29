import { type Favorites } from '@/types'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage'
import { isGraphQLEnabled, graphqlRequest } from '@/lib/graphqlClient'
import {
  FAVORITES_QUERY,
  IS_FAVORITE_QUERY,
  ADD_FAVORITE_MUTATION,
  REMOVE_FAVORITE_MUTATION,
} from '@/graphql/operations'

export function getFavorites(userId: string): Promise<Favorites> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ favorites: Favorites }>(FAVORITES_QUERY).then((d) => d.favorites)
  }
  const allFavorites = getStorageItem<Favorites[]>(STORAGE_KEYS.FAVORITES, [])
  const favorites = allFavorites.find((f) => f.userId === userId)
  if (favorites) return Promise.resolve(favorites)
  const newFavorites: Favorites = { userId, recipeIds: [] }
  allFavorites.push(newFavorites)
  setStorageItem(STORAGE_KEYS.FAVORITES, allFavorites)
  return Promise.resolve(newFavorites)
}

export function addToFavorites(userId: string, recipeId: string): Promise<Favorites> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ addFavorite: Favorites }>(ADD_FAVORITE_MUTATION, { recipeId }).then((d) => d.addFavorite)
  }
  const favorites = getStorageItem<Favorites[]>(STORAGE_KEYS.FAVORITES, []).find((f) => f.userId === userId) ?? {
    userId,
    recipeIds: [] as string[],
  }
  if (!favorites.recipeIds.includes(recipeId)) {
    favorites.recipeIds.push(recipeId)
    const all = getStorageItem<Favorites[]>(STORAGE_KEYS.FAVORITES, [])
    const idx = all.findIndex((f) => f.userId === userId)
    if (idx >= 0) all[idx] = favorites
    else all.push(favorites)
    setStorageItem(STORAGE_KEYS.FAVORITES, all)
  }
  return Promise.resolve(favorites)
}

export function removeFromFavorites(userId: string, recipeId: string): Promise<Favorites> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ removeFavorite: Favorites }>(REMOVE_FAVORITE_MUTATION, { recipeId }).then(
      (d) => d.removeFavorite,
    )
  }
  const all = getStorageItem<Favorites[]>(STORAGE_KEYS.FAVORITES, [])
  const favorites = all.find((f) => f.userId === userId)
  if (!favorites) return Promise.resolve({ userId, recipeIds: [] })
  favorites.recipeIds = favorites.recipeIds.filter((id) => id !== recipeId)
  setStorageItem(STORAGE_KEYS.FAVORITES, all)
  return Promise.resolve(favorites)
}

export function isFavorite(userId: string, recipeId: string): Promise<boolean> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ isFavorite: boolean }>(IS_FAVORITE_QUERY, { recipeId }).then((d) => d.isFavorite)
  }
  const favorites = getStorageItem<Favorites[]>(STORAGE_KEYS.FAVORITES, []).find((f) => f.userId === userId)
  return Promise.resolve(Boolean(favorites?.recipeIds.includes(recipeId)))
}

export function toggleFavorite(userId: string, recipeId: string): Promise<Favorites> {
  if (isGraphQLEnabled()) {
    return getFavorites(userId).then((fav) =>
      fav.recipeIds.includes(recipeId)
        ? removeFromFavorites(userId, recipeId)
        : addToFavorites(userId, recipeId),
    )
  }
  return getFavorites(userId).then((fav) =>
    fav.recipeIds.includes(recipeId)
      ? removeFromFavorites(userId, recipeId)
      : addToFavorites(userId, recipeId),
  )
}
