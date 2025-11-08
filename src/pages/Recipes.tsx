import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { getAllRecipes } from '@/services/recipeService'
import { type Recipe, DifficultyLevel, RecipeTag } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Clock, ChefHat, Star } from 'lucide-react'

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

export function Recipes() {
  const { user } = useUser()
  const recipes = getAllRecipes()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [maxTime, setMaxTime] = useState<string>('')

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search
      if (searchQuery && !recipe.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Cuisine filter
      if (selectedCuisine !== 'all' && recipe.cuisine !== selectedCuisine) {
        return false
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && recipe.difficulty !== selectedDifficulty) {
        return false
      }

      // Tag filter
      if (selectedTag !== 'all' && !recipe.tags.includes(selectedTag as RecipeTag)) {
        return false
      }

      // Time filter
      if (maxTime && recipe.cookingTime > parseInt(maxTime)) {
        return false
      }

      return true
    })
  }, [recipes, searchQuery, selectedCuisine, selectedDifficulty, selectedTag, maxTime])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Каталог рецептов</h1>
        {user && (
          <Button asChild>
            <Link to="/recipes/new">
              <Plus className="h-4 w-4 mr-2" />
              Добавить рецепт
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Название рецепта..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Кухня</label>
            <Select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
            >
              <option value="all">Все</option>
              {CUISINES.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Сложность</label>
            <Select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="easy">Легко</option>
              <option value="medium">Средне</option>
              <option value="hard">Сложно</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Тег</label>
            <Select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="vegan">Веган</option>
              <option value="vegetarian">Вегетарианское</option>
              <option value="gluten-free">Без глютена</option>
              <option value="dairy-free">Без молока</option>
              <option value="spicy">Острое</option>
              <option value="quick">Быстрое</option>
              <option value="healthy">Здоровое</option>
              <option value="dessert">Десерт</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Макс. время (мин)</label>
            <Input
              type="number"
              placeholder="Не ограничено"
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
              min="1"
            />
          </div>
        </div>

        <div className="md:col-span-3">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Рецепты не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const difficultyLabels: Record<DifficultyLevel, string> = {
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/recipes/${recipe.id}`}>
        {recipe.coverImage ? (
          <img
            src={recipe.coverImage}
            alt={recipe.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <ChefHat className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <CardHeader>
          <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
          <CardDescription className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.cookingTime} мин
            </span>
            <span className="flex items-center gap-1">
              <ChefHat className="h-4 w-4" />
              {difficultyLabels[recipe.difficulty]}
            </span>
            {recipe.averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {recipe.averageRating.toFixed(1)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline">{recipe.cuisine}</Badge>
            {recipe.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 2 && (
              <Badge variant="secondary">+{recipe.tags.length - 2}</Badge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

