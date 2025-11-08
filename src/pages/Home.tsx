import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ShoppingCart, Search } from 'lucide-react'

export function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold">
          Добро пожаловать в HomeCookHub
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Удобный инструмент для хранения рецептов, планирования меню и составления списка покупок
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Button asChild size="lg">
            <Link to="/recipes">Начать готовить</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/planner">Планировщик меню</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Search className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Каталог рецептов</CardTitle>
            <CardDescription>
              Храните и находите рецепты с удобными фильтрами
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Поиск по названию</li>
              <li>• Фильтры по кухне, сложности, времени</li>
              <li>• Теги и категории</li>
              <li>• Детальная информация о каждом рецепте</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Calendar className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Планировщик меню</CardTitle>
            <CardDescription>
              Планируйте питание на неделю вперед
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Распределение рецептов по дням</li>
              <li>• Drag & Drop для удобства</li>
              <li>• Просмотр всей недели</li>
              <li>• Быстрая очистка</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ShoppingCart className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Список покупок</CardTitle>
            <CardDescription>
              Автоматическая генерация списка покупок
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Автогенерация из планировщика</li>
              <li>• Объединение одинаковых ингредиентов</li>
              <li>• Отметка купленных товаров</li>
              <li>• Работа оффлайн</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="text-center space-y-4 py-8">
        <h2 className="text-3xl font-bold">Начните прямо сейчас</h2>
        <p className="text-muted-foreground">
          Создайте аккаунт или войдите, чтобы сохранять свои рецепты и избранное
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link to="/register">Регистрация</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Войти</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

