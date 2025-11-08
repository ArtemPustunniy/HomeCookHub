import { type Recipe, type RecipeForm, type Comment } from '@/types'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage'
import { nanoid } from 'nanoid'
import { defaultRecipes } from '@/data/defaultRecipes'

// Get all recipes
export function getAllRecipes(): Recipe[] {
  return getStorageItem<Recipe[]>(STORAGE_KEYS.RECIPES, [])
}

// Get recipe by ID
export function getRecipeById(id: string): Recipe | null {
  const recipes = getAllRecipes()
  return recipes.find((r) => r.id === id) || null
}

// Create recipe
export function createRecipe(recipeForm: RecipeForm): Recipe {
  const recipes = getAllRecipes()
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
  return newRecipe
}

// Update recipe
export function updateRecipe(id: string, recipeForm: RecipeForm): Recipe | null {
  const recipes = getAllRecipes()
  const index = recipes.findIndex((r) => r.id === id)
  
  if (index === -1) return null
  
  const existingRecipe = recipes[index]
  const updatedRecipe: Recipe = {
    ...existingRecipe,
    ...recipeForm,
    updatedAt: new Date().toISOString(),
  }
  
  recipes[index] = updatedRecipe
  setStorageItem(STORAGE_KEYS.RECIPES, recipes)
  return updatedRecipe
}

// Delete recipe
export function deleteRecipe(id: string): boolean {
  const recipes = getAllRecipes()
  const filtered = recipes.filter((r) => r.id !== id)
  
  if (filtered.length === recipes.length) return false
  
  setStorageItem(STORAGE_KEYS.RECIPES, filtered)
  return true
}

// Add comment
export function addComment(recipeId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Comment | null {
  const recipe = getRecipeById(recipeId)
  if (!recipe) return null
  
  const newComment: Comment = {
    ...comment,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  }
  
  recipe.comments.push(newComment)
  updateRecipe(recipeId, recipe)
  
  return newComment
}

// Update comment
export function updateComment(recipeId: string, commentId: string, content: string, authorId: string): Comment | null {
  const recipe = getRecipeById(recipeId)
  if (!recipe) return null
  
  const comment = recipe.comments.find((c) => c.id === commentId)
  if (!comment || comment.authorId !== authorId) return null
  
  comment.content = content
  comment.updatedAt = new Date().toISOString()
  
  updateRecipe(recipeId, recipe)
  return comment
}

// Delete comment
export function deleteComment(recipeId: string, commentId: string, authorId: string): boolean {
  const recipe = getRecipeById(recipeId)
  if (!recipe) return false
  
  const comment = recipe.comments.find((c) => c.id === commentId)
  if (!comment || comment.authorId !== authorId) return false
  
  recipe.comments = recipe.comments.filter((c) => c.id !== commentId)
  updateRecipe(recipeId, recipe)
  
  return true
}

// Add or update rating
export function setRating(recipeId: string, userId: string, rating: number): Recipe | null {
  const recipe = getRecipeById(recipeId)
  if (!recipe) return null
  
  const existingRatingIndex = recipe.ratings.findIndex((r) => r.userId === userId)
  
  if (existingRatingIndex >= 0) {
    recipe.ratings[existingRatingIndex].rating = rating
  } else {
    recipe.ratings.push({ userId, rating })
  }
  
  // Recalculate average rating
  const total = recipe.ratings.reduce((sum, r) => sum + r.rating, 0)
  recipe.averageRating = total / recipe.ratings.length
  recipe.ratingCount = recipe.ratings.length
  
  updateRecipe(recipeId, recipe)
  return recipe
}

// Get user rating for recipe
export function getUserRating(recipeId: string, userId: string): number | null {
  const recipe = getRecipeById(recipeId)
  if (!recipe) return null
  
  const rating = recipe.ratings.find((r) => r.userId === userId)
  return rating ? rating.rating : null
}

// Initialize default recipes if storage is empty
export function initializeDefaultRecipes(): void {
  const recipes = getAllRecipes()
  
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
    // Update existing system recipes with images if they don't have them
    const updatedRecipes = recipes.map((recipe) => {
      if (recipe.authorId === 'system' && !recipe.coverImage) {
        const defaultRecipe = defaultRecipes.find((dr) => dr.title === recipe.title)
        if (defaultRecipe && defaultRecipe.coverImage) {
          return {
            ...recipe,
            coverImage: defaultRecipe.coverImage,
            updatedAt: new Date().toISOString(),
          }
        }
      }
      return recipe
    })
    
    // Check if any recipes were updated
    const hasChanges = updatedRecipes.some((updated, index) => 
      updated.coverImage !== recipes[index]?.coverImage
    )
    
    if (hasChanges) {
      setStorageItem(STORAGE_KEYS.RECIPES, updatedRecipes)
    }
  }
}

