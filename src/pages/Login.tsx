import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { getApiBase, isGraphQLEnabled } from '@/lib/graphqlClient'
import { STORAGE_KEYS, setStorageItem } from '@/lib/storage'

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const { setUser } = useUser()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const base = getApiBase()
    if (isGraphQLEnabled() && base) {
      try {
        const res = await fetch(`${base}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || res.statusText)
        const { token, user: u } = json
        if (token && u?.id) {
          setStorageItem(STORAGE_KEYS.AUTH_TOKEN, token)
          setUser({ id: u.id, name: u.name, role: u.role ?? 'user' })
          navigate('/recipes')
          return
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка входа')
        return
      }
    }
    setError('Для входа нужен бэкенд. Добавьте VITE_GRAPHQL_HTTP в .env')
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>Введите email и пароль для входа</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <FormItem>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input id="email" type="email" {...register('email')} placeholder="email@example.com" />
              {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
            </FormItem>
            <FormItem>
              <FormLabel htmlFor="password">Пароль</FormLabel>
              <Input id="password" type="password" {...register('password')} placeholder="Пароль" />
              {errors.password && <FormMessage>{errors.password.message}</FormMessage>}
            </FormItem>
            <Button type="submit" className="w-full">
              Войти
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
