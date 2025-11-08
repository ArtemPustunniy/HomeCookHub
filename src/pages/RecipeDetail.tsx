import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { getRecipeById, addComment, deleteComment, setRating, getUserRating } from '@/services/recipeService'
import { isFavorite, toggleFavorite } from '@/services/favoritesService'
import { type Recipe, DifficultyLevel } from '@/types'
import { getImagePath } from '@/lib/imagePath'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Clock, ChefHat, Star, Heart, Trash2, Edit, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
}

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const recipe = id ? getRecipeById(id) : null

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Рецепт не найден</p>
        <Button asChild className="mt-4">
          <Link to="/recipes">Вернуться к рецептам</Link>
        </Button>
      </div>
    )
  }

  return <RecipeDetailContent recipe={recipe} />
}

function RecipeDetailContent({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate()
  const { user } = useUser()
  const [commentText, setCommentText] = useState('')
  const [userRating, setUserRatingState] = useState<number | null>(
    user ? getUserRating(recipe.id, user.id) : null
  )
  const [isFav, setIsFav] = useState(user ? isFavorite(user.id, recipe.id) : false)

  const handleAddComment = () => {
    if (!user || !commentText.trim()) return

    addComment(recipe.id, {
      recipeId: recipe.id,
      authorId: user.id,
      authorName: user.name,
      content: commentText.trim(),
    })
    setCommentText('')
    navigate(0)
  }

  const handleDeleteComment = (commentId: string) => {
    if (!user) return
    if (confirm('Удалить комментарий?')) {
      deleteComment(recipe.id, commentId, user.id)
      navigate(0)
    }
  }

  const handleRating = (rating: number) => {
    if (!user) return
    setRating(recipe.id, user.id, rating)
    setUserRatingState(rating)
    navigate(0)
  }

  const handleToggleFavorite = () => {
    if (!user) {
      navigate('/login')
      return
    }
    toggleFavorite(user.id, recipe.id)
    setIsFav(!isFav)
  }

  const isOwner = user && recipe.authorId === user.id

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/recipes">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к рецептам
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {recipe.coverImage && (
            <img
              src={getImagePath(recipe.coverImage)}
              alt={recipe.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl mb-2">{recipe.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {recipe.cookingTime} минут
                    </span>
                    <span className="flex items-center gap-1">
                      <ChefHat className="h-4 w-4" />
                      {difficultyLabels[recipe.difficulty]}
                    </span>
                    <span>{recipe.cuisine}</span>
                    {recipe.averageRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {recipe.averageRating.toFixed(1)} ({recipe.ratingCount})
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {user && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleFavorite}
                      aria-label="Добавить в избранное"
                    >
                      <Heart
                        className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
                      />
                    </Button>
                  )}
                  {isOwner && (
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/recipes/${recipe.id}/edit`}>
                        <Edit className="h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Ингредиенты</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span>
                        {ingredient.name}
                        {ingredient.amount && (
                          <>
                            {' '}
                            - {ingredient.amount} {ingredient.unit || ''}
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Инструкции</h3>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <span className="flex-1">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {recipe.nutrition && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Пищевая ценность</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {recipe.nutrition.calories && (
                      <div>
                        <p className="text-sm text-muted-foreground">Калории</p>
                        <p className="text-lg font-semibold">{recipe.nutrition.calories}</p>
                      </div>
                    )}
                    {recipe.nutrition.protein && (
                      <div>
                        <p className="text-sm text-muted-foreground">Белки</p>
                        <p className="text-lg font-semibold">{recipe.nutrition.protein}г</p>
                      </div>
                    )}
                    {recipe.nutrition.carbs && (
                      <div>
                        <p className="text-sm text-muted-foreground">Углеводы</p>
                        <p className="text-lg font-semibold">{recipe.nutrition.carbs}г</p>
                      </div>
                    )}
                    {recipe.nutrition.fat && (
                      <div>
                        <p className="text-sm text-muted-foreground">Жиры</p>
                        <p className="text-lg font-semibold">{recipe.nutrition.fat}г</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">
                  Автор: {recipe.authorName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Создано: {format(new Date(recipe.createdAt), 'd MMMM yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>

          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Оцените рецепт</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRating(rating)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          userRating && rating <= userRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Комментарии ({recipe.comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Добавить комментарий..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                    Отправить
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {recipe.comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{comment.authorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(comment.createdAt), 'd MMMM yyyy, HH:mm')}
                        </p>
                      </div>
                      {user && comment.authorId === user.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p>{comment.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

