import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUser } from '@/contexts/UserContext'
import { useRecipe, useCreateRecipe, useUpdateRecipe, useDeleteRecipe } from '@/hooks/useRecipes'
import { getStorageItem } from '@/lib/storage'
import { STORAGE_KEYS } from '@/lib/storage'
import { RecipeFormSchema, type RecipeForm, DifficultyLevel, RecipeTag } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react'
import { nanoid } from 'nanoid'

const DIFFICULTIES: { value: DifficultyLevel; label: string }[] = [
  { value: 'easy', label: 'Легко' },
  { value: 'medium', label: 'Средне' },
  { value: 'hard', label: 'Сложно' },
]

const TAGS: { value: RecipeTag; label: string }[] = [
  { value: 'vegan', label: 'Веган' },
  { value: 'vegetarian', label: 'Вегетарианское' },
  { value: 'gluten-free', label: 'Без глютена' },
  { value: 'dairy-free', label: 'Без молока' },
  { value: 'spicy', label: 'Острое' },
  { value: 'quick', label: 'Быстрое' },
  { value: 'healthy', label: 'Здоровое' },
  { value: 'dessert', label: 'Десерт' },
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch', label: 'Обед' },
  { value: 'dinner', label: 'Ужин' },
  { value: 'snack', label: 'Перекус' },
]

const CUISINES = [
  'Русская',
  'Итальянская',
  'Японская',
  'Китайская',
  'Французская',
  'Мексиканская',
  'Индийская',
  'Американская',
  'Другая',
]

export function RecipeForm() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const navigate = useNavigate()
  const isEdit = !!id && id !== 'new'

  const { data: recipe } = useRecipe(isEdit ? id : undefined)
  const createMutation = useCreateRecipe()
  const updateMutation = useUpdateRecipe()
  const deleteMutation = useDeleteRecipe()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RecipeForm>({
    resolver: zodResolver(RecipeFormSchema),
    defaultValues: {
      title: '',
      cookingTime: 30,
      difficulty: 'medium',
      cuisine: '',
      tags: [],
      coverImage: '',
      ingredients: [],
      instructions: [],
      nutrition: undefined,
      authorId: user?.id || '',
      authorName: user?.name || '',
    },
  })

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: 'ingredients',
  })

  const instructions = watch('instructions')
  
  const addInstruction = () => {
    const current = instructions || []
    setValue('instructions', [...current, ''])
  }

  const removeInstruction = (index: number) => {
    const current = instructions || []
    setValue('instructions', current.filter((_, i) => i !== index))
  }

  const watchedTags = watch('tags')

  useEffect(() => {
    if (isEdit && recipe) {
      if (recipe.authorId !== user?.id) {
        navigate('/recipes')
        return
      }
      reset({
        title: recipe.title,
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        tags: recipe.tags,
        coverImage: recipe.coverImage || '',
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        nutrition: recipe.nutrition,
        authorId: recipe.authorId,
        authorName: recipe.authorName,
      })
    } else if (user) {
      setValue('authorId', user.id)
      setValue('authorName', user.name)
    }
  }, [isEdit, recipe, user, navigate, reset, setValue])

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Необходима авторизация</p>
        <Button asChild>
          <Link to="/login">Войти</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = async (data: RecipeForm) => {
    try {
      const token = getStorageItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null)
      const debugInfo = `id=${id} isEdit=${isEdit} hasToken=${!!token}`
      console.log('[RecipeForm onSubmit]', debugInfo)
      if (isEdit) {
        if (!id) {
          alert('ID рецепта не найден. ' + debugInfo)
          return
        }
        await updateMutation.mutateAsync({ id, recipeForm: data })
      } else {
        await createMutation.mutateAsync(data)
      }
      navigate('/recipes')
    } catch (e) {
      console.error('Recipe save error:', e)
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения рецепта'
      const full = (e as any)?.graphqlResponse ? `\n\nОтвет сервера:\n${(e as any).graphqlResponse}` : ''
      alert(msg + full)
    }
  }

  const onValidationError = (err: Record<string, unknown>) => {
    console.error('[RecipeForm] Validation failed:', err)
    const flatten = (obj: unknown, prefix = ''): string[] => {
      if (obj && typeof obj === 'object' && 'message' in obj && typeof (obj as { message?: string }).message === 'string')
        return [`${prefix}: ${(obj as { message: string }).message}`]
      if (obj && typeof obj === 'object' && !Array.isArray(obj))
        return Object.entries(obj).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k))
      return []
    }
    const msg = flatten(err).join('; ') || JSON.stringify(err)
    alert('Ошибка валидации формы: ' + msg)
  }

  const handleDelete = () => {
    if (!id) return
    if (confirm('Вы уверены, что хотите удалить этот рецепт?')) {
      deleteMutation.mutate(id)
      navigate('/recipes')
    }
  }

  const toggleTag = (tag: RecipeTag) => {
    const currentTags = watchedTags || []
    if (currentTags.includes(tag)) {
      setValue('tags', currentTags.filter((t) => t !== tag))
    } else {
      setValue('tags', [...currentTags, tag])
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" asChild>
        <Link to={isEdit ? `/recipes/${id}` : '/recipes'}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Редактировать рецепт' : 'Новый рецепт'}</CardTitle>
          {isEdit && (
            <Button variant="destructive" onClick={handleDelete} className="mt-4">
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить рецепт
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">
            <FormItem>
              <FormLabel>Название *</FormLabel>
              <Input {...register('title')} />
              {errors.title && <FormMessage>{errors.title.message}</FormMessage>}
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Время приготовления (мин) *</FormLabel>
                <Input
                  type="number"
                  min="1"
                  {...register('cookingTime', { valueAsNumber: true })}
                />
                {errors.cookingTime && <FormMessage>{errors.cookingTime.message}</FormMessage>}
              </FormItem>

              <FormItem>
                <FormLabel>Сложность *</FormLabel>
                <Select {...register('difficulty')}>
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </Select>
                {errors.difficulty && <FormMessage>{errors.difficulty.message}</FormMessage>}
              </FormItem>
            </div>

            <FormItem>
              <FormLabel>Кухня *</FormLabel>
              <Select {...register('cuisine')}>
                <option value="">Выберите кухню</option>
                {CUISINES.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </Select>
              {errors.cuisine && <FormMessage>{errors.cuisine.message}</FormMessage>}
            </FormItem>

            <FormItem>
              <FormLabel>Обложка (URL)</FormLabel>
              <Input
                type="url"
                {...register('coverImage')}
                placeholder="https://example.com/image.jpg"
              />
              {errors.coverImage && <FormMessage>{errors.coverImage.message}</FormMessage>}
            </FormItem>

            <FormItem>
              <FormLabel>Теги</FormLabel>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={watchedTags?.includes(tag.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.value)}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </FormItem>

            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Ингредиенты *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendIngredient({ id: nanoid(), name: '', amount: undefined, unit: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {ingredientFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Название"
                      {...register(`ingredients.${index}.name`)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Количество"
                      {...register(`ingredients.${index}.amount`, { valueAsNumber: true })}
                      className="w-24"
                    />
                    <Input
                      placeholder="Ед. изм."
                      {...register(`ingredients.${index}.unit`)}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {errors.ingredients && <FormMessage>{errors.ingredients.message}</FormMessage>}
              </div>
            </FormItem>

            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Инструкции *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInstruction}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить шаг
                </Button>
              </div>
              <div className="space-y-2">
                {instructions?.map((_, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mt-2">
                      {index + 1}
                    </span>
                    <Textarea
                      {...register(`instructions.${index}`)}
                      placeholder={`Шаг ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInstruction(index)}
                      className="mt-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {errors.instructions && <FormMessage>{errors.instructions.message}</FormMessage>}
              </div>
            </FormItem>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormItem>
                <FormLabel>Калории</FormLabel>
                <Input
                  type="number"
                  {...register('nutrition.calories', { valueAsNumber: true })}
                />
              </FormItem>
              <FormItem>
                <FormLabel>Белки (г)</FormLabel>
                <Input
                  type="number"
                  {...register('nutrition.protein', { valueAsNumber: true })}
                />
              </FormItem>
              <FormItem>
                <FormLabel>Углеводы (г)</FormLabel>
                <Input
                  type="number"
                  {...register('nutrition.carbs', { valueAsNumber: true })}
                />
              </FormItem>
              <FormItem>
                <FormLabel>Жиры (г)</FormLabel>
                <Input
                  type="number"
                  {...register('nutrition.fat', { valueAsNumber: true })}
                />
              </FormItem>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? 'Сохранить' : 'Создать'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={isEdit ? `/recipes/${id}` : '/recipes'}>Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
