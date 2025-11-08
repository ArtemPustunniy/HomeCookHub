import { useState } from 'react'
import { getShoppingList, updateShoppingListItem, deleteShoppingListItem, togglePurchased, clearShoppingList, addShoppingListItem } from '@/services/shoppingListService'
import { type ShoppingListItem } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, ShoppingCart, Plus, CheckCircle2, Circle } from 'lucide-react'

function Checkbox({ checked, onCheckedChange, ...props }: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  [key: string]: any
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
  const [list, setList] = useState(getShoppingList())
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('')

  const handleAddItem = () => {
    if (!newItemName.trim()) return

    const updated = addShoppingListItem({
      name: newItemName.trim(),
      amount: newItemAmount ? parseFloat(newItemAmount) : undefined,
      unit: newItemUnit || undefined,
      purchased: false,
    })

    setList(updated)
    setNewItemName('')
    setNewItemAmount('')
    setNewItemUnit('')
  }

  const handleTogglePurchased = (itemId: string) => {
    const updated = togglePurchased(itemId)
    if (updated) {
      setList(updated)
    }
  }

  const handleUpdateItem = (itemId: string, updates: Partial<ShoppingListItem>) => {
    const updated = updateShoppingListItem(itemId, updates)
    if (updated) {
      setList(updated)
    }
  }

  const handleDeleteItem = (itemId: string) => {
    const updated = deleteShoppingListItem(itemId)
    if (updated) {
      setList(updated)
    }
  }

  const handleClearList = () => {
    if (confirm('Очистить весь список?')) {
      const cleared = clearShoppingList()
      setList(cleared)
    }
  }

  const purchasedCount = list.items.filter((item) => item.purchased).length
  const totalCount = list.items.length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Список покупок</h1>
          <p className="text-muted-foreground">
            {purchasedCount} из {totalCount} куплено
          </p>
        </div>
        {list.items.length > 0 && (
          <Button variant="destructive" onClick={handleClearList}>
            <Trash2 className="h-4 w-4 mr-2" />
            Очистить список
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Добавить продукт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Название продукта"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              className="flex-1 min-w-[200px]"
            />
            <Input
              type="number"
              placeholder="Количество"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="w-24"
            />
            <Input
              placeholder="Ед. изм."
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="w-24"
            />
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>
        </CardContent>
      </Card>

      {list.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Список покупок пуст</p>
            <p className="text-sm text-muted-foreground mt-2">
              Добавьте продукты вручную или сгенерируйте из планировщика
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Продукты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {list.items.map((item) => (
                <ShoppingListItemComponent
                  key={item.id}
                  item={item}
                  onTogglePurchased={() => handleTogglePurchased(item.id)}
                  onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ShoppingListItemComponent({
  item,
  onTogglePurchased,
  onUpdate,
  onDelete,
}: {
  item: ShoppingListItem
  onTogglePurchased: () => void
  onUpdate: (updates: Partial<ShoppingListItem>) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [amount, setAmount] = useState(item.amount?.toString() || '')
  const [unit, setUnit] = useState(item.unit || '')

  const handleSave = () => {
    onUpdate({
      name: name.trim(),
      amount: amount ? parseFloat(amount) : undefined,
      unit: unit || undefined,
    })
    setIsEditing(false)
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 border rounded-lg ${
        item.purchased ? 'opacity-60 bg-muted' : ''
      }`}
    >
      <Checkbox checked={item.purchased} onCheckedChange={onTogglePurchased} />
      {isEditing ? (
        <div className="flex-1 flex gap-2 items-center">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24"
            placeholder="Кол-во"
          />
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-24"
            placeholder="Ед. изм."
          />
          <Button size="sm" onClick={handleSave}>
            Сохранить
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Отмена
          </Button>
        </div>
      ) : (
        <>
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <p className={item.purchased ? 'line-through' : ''}>{item.name}</p>
            {(item.amount || item.unit) && (
              <p className="text-sm text-muted-foreground">
                {item.amount} {item.unit}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}

