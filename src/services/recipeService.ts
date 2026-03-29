import { type Recipe, type RecipeForm, type Comment } from '@/types'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage'
import { nanoid } from 'nanoid'
import { defaultRecipes } from '@/data/defaultRecipes'
import { isGraphQLEnabled, graphqlRequest, getApiBase } from '@/lib/graphqlClient'
import {
  RECIPES_QUERY,
  RECIPE_QUERY,
  RECIPE_RATING_QUERY,
  CREATE_RECIPE_MUTATION,
  UPDATE_RECIPE_MUTATION,
  DELETE_RECIPE_MUTATION,
  ADD_COMMENT_MUTATION,
  UPDATE_COMMENT_MUTATION,
  DELETE_COMMENT_MUTATION,
  SET_RATING_MUTATION,
} from '@/graphql/operations'

function toRecipeFormInput(form: RecipeForm) {
  return {
    title: form.title,
    cookingTime: form.cookingTime,
    difficulty: form.difficulty,
    cuisine: form.cuisine,
    tags: form.tags ?? [],
    coverImage: form.coverImage ?? '',
    ingredients: form.ingredients,
    instructions: form.instructions,
    nutrition: form.nutrition ?? undefined,
  }
}

export function getAllRecipes(): Promise<Recipe[]> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ recipes: { items: Recipe[] } }>(RECIPES_QUERY, { page: 1, limit: 500 }).then(
      (d) => d.recipes.items,
    )
  }
  return Promise.resolve(getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, []))
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  if (!id || typeof id !== 'string' || id.trim() === '') return Promise.resolve(null)
  if (isGraphQLEnabled()) {
    try {
      const data = await graphqlRequest<{ recipe: Recipe | null }>(RECIPE_QUERY, { id })
      if (data.recipe) return data.recipe
      // Fallback to REST when GraphQL returns null (e.g. different API path)
      const base = getApiBase()
      if (base) {
        const res = await fetch(`${base}/recipes/${encodeURIComponent(id)}`)
        if (res.ok) return res.json()
      }
      return null
    } catch (e) {
      // On GraphQL error, try REST fallback
      const base = getApiBase()
      if (base) {
        const res = await fetch(`${base}/recipes/${encodeURIComponent(id)}`)
        if (res.ok) return res.json()
      }
      throw e
    }
  }
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  return Promise.resolve(recipes.find((r) => r.id === id) || null)
}

export function createRecipe(recipeForm: RecipeForm): Promise<Recipe> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ createRecipe: Recipe }>(CREATE_RECIPE_MUTATION, {
      input: toRecipeFormInput(recipeForm),
    }).then((d) => d.createRecipe)
  }
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  const newRecipe: Recipe = {
    ...recipeForm,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 0,
    ratingCount: 0,
    ratings: [],
    comments: [],
  }
  recipes.push(newRecipe)
  setStorageItem(STORAGE_KEYS.RECIPES, recipes)
  return Promise.resolve(newRecipe)
}

export function updateRecipe(id: string, recipeForm: RecipeForm): Promise<Recipe | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ updateRecipe: Recipe }>(UPDATE_RECIPE_MUTATION, {
      id,
      input: toRecipeFormInput(recipeForm),
    }).then((d) => d.updateRecipe)
  }
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  const index = recipes.findIndex((r) => r.id === id)
  if (index === -1) return Promise.resolve(null)
  const existingRecipe = recipes[index]
  const updatedRecipe: Recipe = {
    ...existingRecipe,
    ...recipeForm,
    updatedAt: new Date().toISOString(),
  }
  recipes[index] = updatedRecipe
  setStorageItem(STORAGE_KEYS.RECIPES, recipes)
  return Promise.resolve(updatedRecipe)
}

export function deleteRecipe(id: string): Promise<boolean> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ deleteRecipe: boolean }>(DELETE_RECIPE_MUTATION, { id }).then((d) => d.deleteRecipe)
  }
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  const filtered = recipes.filter((r) => r.id !== id)
  if (filtered.length === recipes.length) return Promise.resolve(false)
  setStorageItem(STORAGE_KEYS.RECIPES, filtered)
  return Promise.resolve(true)
}

export function addComment(
  recipeId: string,
  comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Comment | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ addComment: Comment }>(ADD_COMMENT_MUTATION, {
      recipeId,
      content: comment.content,
    }).then((d) => d.addComment)
  }
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) return Promise.resolve(null)
  const newComment: Comment = {
    ...comment,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  }
  recipe.comments.push(newComment)
  setStorageItem(STORAGE_KEYS.RECIPES, recipes)
  return Promise.resolve(newComment)
}

export function updateComment(
  recipeId: string,
  commentId: string,
  content: string,
  authorId: string,
): Promise<Comment | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ updateComment: Comment }>(UPDATE_COMMENT_MUTATION, {
      recipeId,
      commentId,
      content,
    }).then((d) => d.updateComment)
  }
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) return Promise.resolve(null)
  const comment = recipe.comments.find((c) => c.id === commentId)
  if (!comment || comment.authorId !== authorId) return Promise.resolve(null)
  comment.content = content
  comment.updatedAt = new Date().toISOString()
  setStorageItem(STORAGE_KEYS.RECIPES, recipes)
  return Promise.resolve(comment)
}

export function deleteComment(recipeId: string, commentId: string, authorId: string): Promise<boolean> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ deleteComment: boolean }>(DELETE_COMMENT_MUTATION, { recipeId, commentId }).then(
      (d) => d.deleteComment,
    )
  }
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) return Promise.resolve(false)
  const comment = recipe.comments.find((c) => c.id === commentId)
  if (!comment || comment.authorId !== authorId) return Promise.resolve(false)
  recipe.comments = recipe.comments.filter((c) => c.id !== commentId)
  setStorageItem(STORAGE_KEYS.RECIPES, recipes)
  return Promise.resolve(true)
}

export function setRating(recipeId: string, _userId: string, rating: number): Promise<Recipe | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ setRating: Recipe }>(SET_RATING_MUTATION, { recipeId, rating }).then((d) => d.setRating)
  }
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) return Promise.resolve(null)
  const existingRatingIndex = recipe.ratings.findIndex((r) => r.userId === _userId)
  if (existingRatingIndex >= 0) {
    recipe.ratings[existingRatingIndex].rating = rating
  } else {
    recipe.ratings.push({ userId: _userId, rating })
  }
  const total = recipe.ratings.reduce((sum, r) => sum + r.rating, 0)
  recipe.averageRating = total / recipe.ratings.length
  recipe.ratingCount = recipe.ratings.length
  recipe.updatedAt = new Date().toISOString()
  setStorageItem(STORAGE_KEYS.RECIPES, recipes)
  return Promise.resolve(recipe)
}

export function getUserRating(recipeId: string, _userId: string): Promise<number | null> {
  if (isGraphQLEnabled()) {
    return graphqlRequest<{ recipeRating: number }>(RECIPE_RATING_QUERY, { recipeId }).then((d) =>
      d.recipeRating > 0 ? d.recipeRating : null,
    )
  }
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) return Promise.resolve(null)
  const rating = recipe.ratings.find((r) => r.userId === _userId)
  return Promise.resolve(rating ? rating.rating : null)
}

export function initializeDefaultRecipes(): void {
  if (isGraphQLEnabled()) return
  const recipes = getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
  if (recipes.length === 0) {
    const now = new Date().toISOString()
    const initializedRecipes: Recipe[] = defaultRecipes.map((recipe) => ({
      ...recipe,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
      averageRating: 0,
      ratingCount: 0,
      ratings: [],
      comments: [],
    }))
    setStorageItem(STORAGE_KEYS.RECIPES, initializedRecipes)
  } else {
    const updatedRecipes = recipes.map((recipe) => {
      if (recipe.authorId === 'system' && !recipe.coverImage) {
        const defaultRecipe = defaultRecipes.find((dr) => dr.title === recipe.title)
        if (defaultRecipe?.coverImage) {
          return { ...recipe, coverImage: defaultRecipe.coverImage, updatedAt: new Date().toISOString() }
        }
      }
      return recipe
    })
    const hasChanges = updatedRecipes.some((u, i) => u.coverImage !== recipes[i]?.coverImage)
    if (hasChanges) setStorageItem(STORAGE_KEYS.RECIPES, updatedRecipes)
  }
}
