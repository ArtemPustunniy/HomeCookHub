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
import { getApiBase } from '@/lib/graphqlClient'
import { httpErrorMessage } from '@/lib/httpErrorMessage'
import { setStorageItem } from '@/lib/storage'
import { STORAGE_KEYS } from '@/lib/storage'

const registerSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').trim(),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
})

type RegisterForm = z.infer<typeof registerSchema>

export function Register() {
  const { setUser } = useUser()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    const base = getApiBase()
    if (base) {
      try {
        const res = await fetch(`${base}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
        })
        const json = await res.json()
        if (!res.ok) {
          const field =
            json?.details?.fieldErrors?.email?.[0] ?? json?.details?.fieldErrors?.password?.[0]
          setError(
            (typeof field === 'string' && field) ||
              httpErrorMessage(json, 'Ошибка регистрации'),
          )
          return
        }
        if (json.token && json.user) {
          setStorageItem(STORAGE_KEYS.AUTH_TOKEN, json.token)
          setUser(json.user)
          navigate('/recipes')
          return
        }
      } catch (e) {
        setError('Сервер недоступен')
        return
      }
    }
    setUser({ id: crypto.randomUUID(), name: data.name, role: 'user' })
    navigate('/recipes')
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт для сохранения рецептов</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <FormItem>
              <FormLabel htmlFor="name">Имя</FormLabel>
              <Input id="name" {...register('name')} placeholder="Ваше имя" />
              {errors.name && <FormMessage>{errors.name.message}</FormMessage>}
            </FormItem>
            <FormItem>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input id="email" type="email" {...register('email')} placeholder="email@example.com" />
              {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
            </FormItem>
            <FormItem>
              <FormLabel htmlFor="password">Пароль</FormLabel>
              <Input id="password" type="password" {...register('password')} placeholder="Минимум 6 символов" />
              {errors.password && <FormMessage>{errors.password.message}</FormMessage>}
            </FormItem>
            <Button type="submit" className="w-full">
              Зарегистрироваться
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Войти
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
