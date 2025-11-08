import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { nanoid } from 'nanoid'

const loginSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').trim(),
})

type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const { setUser } = useUser()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginForm) => {
    setUser({
      id: nanoid(),
      name: data.name,
    })
    navigate('/recipes')
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>Введите ваше имя для входа в систему</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel htmlFor="name">Имя</FormLabel>
              <Input id="name" {...register('name')} placeholder="Ваше имя" />
              {errors.name && <FormMessage>{errors.name.message}</FormMessage>}
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
