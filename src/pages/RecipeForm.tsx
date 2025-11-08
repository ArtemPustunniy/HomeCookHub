import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { getRecipeById, createRecipe, updateRecipe, deleteRecipe } from '@/services/recipeService'
import { type RecipeForm as RecipeFormType, type Ingredient, DifficultyLevel, RecipeTag } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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
  const isEdit = !!id

  const [formData, setFormData] = useState<RecipeFormType>({
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
  })

  useEffect(() => {
    if (isEdit && id) {
      const recipe = getRecipeById(id)
      if (recipe) {
        if (recipe.authorId !== user?.id) {
          navigate('/recipes')
          return
        }
        setFormData({
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
      }
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        authorId: user.id,
        authorName: user.name,
      }))
    }
  }, [id, isEdit, user, navigate])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isEdit && id) {
      updateRecipe(id, formData)
    } else {
      createRecipe(formData)
    }
    
    navigate('/recipes')
  }

  const handleDelete = () => {
    if (!id) return
    if (confirm('Вы уверены, что хотите удалить этот рецепт?')) {
      deleteRecipe(id)
      navigate('/recipes')
    }
  }

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { id: nanoid(), name: '', amount: undefined, unit: '' },
      ],
    }))
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number | undefined) => {
    setFormData((prev) => {
      const newIngredients = [...prev.ingredients]
      newIngredients[index] = { ...newIngredients[index], [field]: value }
      return { ...prev, ingredients: newIngredients }
    })
  }

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const addInstruction = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }))
  }

  const updateInstruction = (index: number, value: string) => {
    setFormData((prev) => {
      const newInstructions = [...prev.instructions]
      newInstructions[index] = value
      return { ...prev, instructions: newInstructions }
    })
  }

  const removeInstruction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }))
  }

  const toggleTag = (tag: RecipeTag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Время приготовления (мин) *</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.cookingTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cookingTime: parseInt(e.target.value) || 0 }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Сложность *</label>
                <Select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, difficulty: e.target.value as DifficultyLevel }))
                  }
                  required
                >
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Кухня *</label>
              <Select
                value={formData.cuisine}
                onChange={(e) => setFormData((prev) => ({ ...prev, cuisine: e.target.value }))}
                required
              >
                <option value="">Выберите кухню</option>
                {CUISINES.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Обложка (URL)</label>
              <Input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Теги</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={formData.tags.includes(tag.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.value)}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Ингредиенты *</label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Название"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Количество"
                      value={ingredient.amount || ''}
                      onChange={(e) =>
                        updateIngredient(
                          index,
                          'amount',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      className="w-24"
                    />
                    <Input
                      placeholder="Ед. изм."
                      value={ingredient.unit || ''}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
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
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Инструкции *</label>
                <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить шаг
                </Button>
              </div>
              <div className="space-y-2">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mt-2">
                      {index + 1}
                    </span>
                    <Textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder={`Шаг ${index + 1}`}
                      required
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
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Калории</label>
                <Input
                  type="number"
                  value={formData.nutrition?.calories || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nutrition: {
                        ...prev.nutrition,
                        calories: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Белки (г)</label>
                <Input
                  type="number"
                  value={formData.nutrition?.protein || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nutrition: {
                        ...prev.nutrition,
                        protein: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Углеводы (г)</label>
                <Input
                  type="number"
                  value={formData.nutrition?.carbs || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nutrition: {
                        ...prev.nutrition,
                        carbs: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Жиры (г)</label>
                <Input
                  type="number"
                  value={formData.nutrition?.fat || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nutrition: {
                        ...prev.nutrition,
                        fat: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit">{isEdit ? 'Сохранить' : 'Создать'}</Button>
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

