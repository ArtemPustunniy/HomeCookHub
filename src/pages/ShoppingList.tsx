import { useState } from 'react'
import {
  useShoppingList,
  useAddShoppingListItem,
  useUpdateShoppingListItem,
  useDeleteShoppingListItem,
  useTogglePurchased,
  useClearShoppingList,
} from '@/hooks/useShoppingList'
import { type ShoppingListItem } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, ShoppingCart, Plus, CheckCircle2, Circle } from 'lucide-react'

function Checkbox({ checked, onCheckedChange, ...props }: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  [key: string]: unknown
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className="flex items-center justify-center w-5 h-5 rounded border-2 border-primary hover:bg-accent transition-colors"
      {...props}
    >
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-primary fill-primary" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )
}

export function ShoppingList() {
  const { data: list, isLoading } = useShoppingList()
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('')

  const addItemMutation = useAddShoppingListItem()
  const toggleMutation = useTogglePurchased()
  const updateMutation = useUpdateShoppingListItem()
  const deleteMutation = useDeleteShoppingListItem()
  const clearMutation = useClearShoppingList()

  const handleAddItem = () => {
    if (!newItemName.trim()) return
    addItemMutation.mutate(
      {
        name: newItemName.trim(),
        amount: newItemAmount ? parseFloat(newItemAmount) : undefined,
        unit: newItemUnit || undefined,
        purchased: false,
      },
      {
        onSuccess: () => {
          setNewItemName('')
          setNewItemAmount('')
          setNewItemUnit('')
        },
      },
    )
  }

  const handleTogglePurchased = (itemId: string) => {
    toggleMutation.mutate(itemId)
  }

  const handleUpdateItem = (itemId: string, updates: Partial<ShoppingListItem>) => {
    updateMutation.mutate({ itemId, updates })
  }

  const handleDeleteItem = (itemId: string) => {
    deleteMutation.mutate(itemId)
  }

  const handleClearList = () => {
    if (confirm('Очистить весь список?')) {
      clearMutation.mutate()
    }
  }

  if (isLoading || !list) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  const purchasedCount = list.items.filter((item) => item.purchased).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" />
          Список покупок
        </h1>
        <p className="text-muted-foreground">
          {purchasedCount} из {list.items.length} куплено
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Добавить позицию</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            placeholder="Название"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <Input
            type="number"
            placeholder="Кол-во"
            value={newItemAmount}
            onChange={(e) => setNewItemAmount(e.target.value)}
            className="w-24"
          />
          <Input
            placeholder="Ед."
            value={newItemUnit}
            onChange={(e) => setNewItemUnit(e.target.value)}
            className="w-20"
          />
          <Button onClick={handleAddItem} disabled={!newItemName.trim() || addItemMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </CardContent>
      </Card>

      {list.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Список пуст. Добавьте позиции выше или сгенерируйте из планировщика.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Позиции</CardTitle>
            <Button variant="outline" size="sm" onClick={handleClearList} disabled={clearMutation.isPending}>
              Очистить список
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {list.items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-2 p-2 rounded border ${
                    item.purchased ? 'bg-muted/50 opacity-75' : ''
                  }`}
                >
                  <Checkbox
                    checked={item.purchased}
                    onCheckedChange={() => handleTogglePurchased(item.id)}
                  />
                  <span className={item.purchased ? 'line-through text-muted-foreground' : ''}>
                    {item.name}
                    {item.amount != null && ` — ${item.amount}`}
                    {item.unit && ` ${item.unit}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
