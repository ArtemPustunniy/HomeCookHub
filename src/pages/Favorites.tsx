import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { getFavorites, removeFromFavorites } from '@/services/favoritesService'
import { getAllRecipes } from '@/services/recipeService'
import { type Recipe, DifficultyLevel } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Clock, ChefHat, Star } from 'lucide-react'

const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
}

export function Favorites() {
  const navigate = useNavigate()
  const { user } = useUser()

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

  const favorites = getFavorites(user.id)
  const allRecipes = getAllRecipes()
  const favoriteRecipes = allRecipes.filter((recipe) =>
    favorites.recipeIds.includes(recipe.id)
  )

  const handleRemoveFavorite = (recipeId: string) => {
    removeFromFavorites(user.id, recipeId)
    navigate(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Избранное</h1>
        <p className="text-muted-foreground">
          {favoriteRecipes.length} {favoriteRecipes.length === 1 ? 'рецепт' : 'рецептов'}
        </p>
      </div>

      {favoriteRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">У вас пока нет избранных рецептов</p>
            <Button asChild className="mt-4">
              <Link to="/recipes">Найти рецепты</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteRecipes.map((recipe) => (
            <FavoriteRecipeCard
              key={recipe.id}
              recipe={recipe}
              onRemove={() => handleRemoveFavorite(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FavoriteRecipeCard({
  recipe,
  onRemove,
}: {
  recipe: Recipe
  onRemove: () => void
}) {
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
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onRemove()
            }}
            className="w-full"
          >
            <Heart className="h-4 w-4 mr-2 fill-red-500 text-red-500" />
            Удалить из избранного
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}

