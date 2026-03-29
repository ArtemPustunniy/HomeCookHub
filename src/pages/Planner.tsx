import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DndContext, type DragEndEvent, closestCenter, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  useCurrentWeekPlanner,
  useMoveRecipe,
  useClearDay,
  useClearWeek,
  useAddRecipeToDay,
} from '@/hooks/usePlanner'
import { useRecipes } from '@/hooks/useRecipes'
import { useGenerateShoppingListFromPlanner } from '@/hooks/useShoppingList'
import { type Recipe } from '@/types'
import { getImagePath } from '@/lib/imagePath'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { GripVertical, X, ShoppingCart, ChefHat } from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'

const DAYS_OF_WEEK = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

function PlannerDayCard({ day, dayIndex, recipes, onClear }: {
  day: { date: string; recipeIds: string[] }
  dayIndex: number
  recipes: Recipe[]
  onClear: () => void
}) {
  const dayRecipes = recipes.filter((r) => day.recipeIds.includes(r.id))
  const { setNodeRef } = useDroppable({
    id: `day-${dayIndex}`,
    data: { dayIndex },
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{DAYS_OF_WEEK[dayIndex]}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(day.date), 'd MMMM')}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={setNodeRef} className="min-h-[100px]">
          <SortableContext items={day.recipeIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {dayRecipes.map((recipe) => (
                <SortableRecipeItem key={recipe.id} recipe={recipe} dayIndex={dayIndex} />
              ))}
              {dayRecipes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Перетащите рецепт сюда
                </p>
              )}
            </div>
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  )
}

function SortableRecipeItem({ recipe, dayIndex }: { recipe: Recipe; dayIndex: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: recipe.id,
    data: { dayIndex, recipe },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-lg hover:bg-accent cursor-move"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {recipe.coverImage ? (
        <img
          src={getImagePath(recipe.coverImage)}
          alt={recipe.title}
          className="w-12 h-12 object-cover rounded"
        />
      ) : (
        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
          <ChefHat className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <Link to={`/recipes/${recipe.id}`} className="flex-1 min-w-0 overflow-hidden">
        <p className="text-sm font-medium truncate">{recipe.title}</p>
      </Link>
    </div>
  )
}

export function Planner() {
  const navigate = useNavigate()
  const { data: planner, isLoading: plannerLoading } = useCurrentWeekPlanner()
  const { data: allRecipes = [], isLoading: recipesLoading } = useRecipes()
  const moveRecipeMutation = useMoveRecipe()
  const clearDayMutation = useClearDay()
  const clearWeekMutation = useClearWeek()
  const addRecipeToDayMutation = useAddRecipeToDay()
  const generateShoppingListMutation = useGenerateShoppingListFromPlanner()

  const recipesMap = useMemo(() => {
    const map = new Map<string, Recipe>()
    allRecipes.forEach((r) => map.set(r.id, r))
    return map
  }, [allRecipes])

  if (plannerLoading || !planner) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  const weekStartDate = parseISO(planner.weekStart)
  const weekEndDate = addDays(weekStartDate, 6)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as { dayIndex: number; recipe: Recipe } | undefined
    const overId = over.id as string

    if (!activeData || !overId.startsWith('day-')) return

    const fromDayIndex = activeData.dayIndex
    const toDayIndex = parseInt(overId.replace('day-', ''))
    const recipeId = active.id as string

    if (!isNaN(toDayIndex) && fromDayIndex !== toDayIndex) {
      moveRecipeMutation.mutate({
        weekStart: planner.weekStart,
        fromDayIndex,
        toDayIndex,
        recipeId,
      })
    }
  }

  const handleClearDay = (dayIndex: number) => {
    if (confirm('Очистить этот день?')) {
      clearDayMutation.mutate({ weekStart: planner.weekStart, dayIndex })
    }
  }

  const handleClearWeek = () => {
    if (confirm('Очистить всю неделю?')) {
      clearWeekMutation.mutate(planner.weekStart)
    }
  }

  const handleGenerateShoppingList = () => {
    const allRecipeIds = planner.days.flatMap((day) => day.recipeIds)
    if (allRecipeIds.length === 0) {
      alert('Добавьте рецепты в планировщик')
      return
    }
    generateShoppingListMutation.mutate(allRecipeIds, { onSuccess: () => navigate('/shopping-list') })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Планировщик меню</h1>
          <p className="text-muted-foreground">
            {format(weekStartDate, 'd MMMM')} -{' '}
            {format(weekEndDate, 'd MMMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearWeek}>
            Очистить неделю
          </Button>
          <Button onClick={handleGenerateShoppingList}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Создать список покупок
          </Button>
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {planner.days.map((day, index) => (
            <div key={day.date} data-day-index={index}>
              <PlannerDayCard
                day={day}
                dayIndex={index}
                recipes={Array.from(recipesMap.values())}
                onClear={() => handleClearDay(index)}
              />
            </div>
          ))}
        </div>
      </DndContext>

      <Card>
        <CardHeader>
          <CardTitle>Добавить рецепты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                planner={planner}
                onAddToDay={(dayIndex) =>
                  addRecipeToDayMutation.mutate({
                    weekStart: planner.weekStart,
                    dayIndex,
                    recipeId: recipe.id,
                  })
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RecipeCard({
  recipe,
  planner,
  onAddToDay,
}: {
  recipe: Recipe
  planner: { weekStart: string; days: { date: string; recipeIds: string[] }[] }
  onAddToDay: (dayIndex: number) => void
}) {
  const handleAddToDay = (dayIndex: number) => {
    onAddToDay(dayIndex)
  }

  return (
    <Card className="overflow-hidden">
      <Link to={`/recipes/${recipe.id}`}>
        {recipe.coverImage ? (
          <img
            src={getImagePath(recipe.coverImage)}
            alt={recipe.title}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-32 bg-muted flex items-center justify-center">
            <ChefHat className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </Link>
      <CardContent className="p-4">
        <Link to={`/recipes/${recipe.id}`}>
          <h3 className="font-semibold mb-2 line-clamp-2">{recipe.title}</h3>
        </Link>
        <Select
          defaultValue=""
          onChange={(e) => {
            const dayIndex = parseInt(e.target.value, 10)
            if (!Number.isNaN(dayIndex)) {
              handleAddToDay(dayIndex)
              ;(e.target as HTMLSelectElement).value = ''
            }
          }}
          className="w-full"
        >
          <option value="">Добавить в день...</option>
          {DAYS_OF_WEEK.map((day, index) => (
            <option key={index} value={index}>
              {day}
            </option>
          ))}
        </Select>
      </CardContent>
    </Card>
  )
}

