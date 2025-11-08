import { z } from 'zod'

export const DifficultyLevel = z.enum(['easy', 'medium', 'hard'])
export type DifficultyLevel = z.infer<typeof DifficultyLevel>

export const RecipeTag = z.enum([
  'vegan',
  'vegetarian',
  'gluten-free',
  'dairy-free',
  'spicy',
  'quick',
  'healthy',
  'dessert',
  'breakfast',
  'lunch',
  'dinner',
  'snack',
])
export type RecipeTag = z.infer<typeof RecipeTag>

export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Название ингредиента обязательно'),
  amount: z.number().positive().optional(),
  unit: z.string().optional(),
})
export type Ingredient = z.infer<typeof IngredientSchema>

export const NutritionSchema = z.object({
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
})
export type Nutrition = z.infer<typeof NutritionSchema>

export const RatingSchema = z.object({
  userId: z.string(),
  rating: z.number().min(1).max(5),
})
export type Rating = z.infer<typeof RatingSchema>

export const CommentSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  content: z.string().min(1, 'Комментарий не может быть пустым'),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})
export type Comment = z.infer<typeof CommentSchema>

export const RecipeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Название рецепта обязательно'),
  cookingTime: z.number().positive('Время приготовления должно быть положительным'),
  difficulty: DifficultyLevel,
  cuisine: z.string().min(1, 'Кухня обязательна'),
  tags: z.array(RecipeTag).default([]),
  coverImage: z.string().url().optional().or(z.literal('')),
  ingredients: z.array(IngredientSchema).min(1, 'Добавьте хотя бы один ингредиент'),
  instructions: z.array(z.string()).min(1, 'Добавьте хотя бы один шаг'),
  nutrition: NutritionSchema.optional(),
  authorId: z.string(),
  authorName: z.string(),
  averageRating: z.number().min(0).max(5).default(0),
  ratingCount: z.number().int().min(0).default(0),
  ratings: z.array(RatingSchema).default([]),
  comments: z.array(CommentSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Recipe = z.infer<typeof RecipeSchema>

export const RecipeFormSchema = RecipeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  averageRating: true,
  ratingCount: true,
  ratings: true,
  comments: true,
})
export type RecipeForm = z.infer<typeof RecipeFormSchema>

export const PlannerDaySchema = z.object({
  date: z.string(), // ISO date string
  recipeIds: z.array(z.string()).default([]),
})
export type PlannerDay = z.infer<typeof PlannerDaySchema>

export const PlannerSchema = z.object({
  weekStart: z.string(), // ISO date string (Monday)
  days: z.array(PlannerDaySchema).length(7),
})
export type Planner = z.infer<typeof PlannerSchema>

export const ShoppingListItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Название продукта обязательно'),
  amount: z.number().optional(),
  unit: z.string().optional(),
  purchased: z.boolean().default(false),
})
export type ShoppingListItem = z.infer<typeof ShoppingListItemSchema>

export const ShoppingListSchema = z.object({
  id: z.string(),
  items: z.array(ShoppingListItemSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type ShoppingList = z.infer<typeof ShoppingListSchema>

export const FavoritesSchema = z.object({
  userId: z.string(),
  recipeIds: z.array(z.string()).default([]),
})
export type Favorites = z.infer<typeof FavoritesSchema>

