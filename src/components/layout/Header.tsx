import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Menu, ChefHat, LogOut } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, setUser } = useUser()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    setUser(null)
    navigate('/')
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <ChefHat className="h-6 w-6" />
          <span className="font-bold text-xl">HomeCookHub</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/recipes" className="text-sm font-medium hover:text-primary transition-colors">
            Рецепты
          </Link>
          <Link to="/planner" className="text-sm font-medium hover:text-primary transition-colors">
            Планировщик
          </Link>
          <Link to="/shopping-list" className="text-sm font-medium hover:text-primary transition-colors">
            Список покупок
          </Link>
          {user && (
            <Link to="/favorites" className="text-sm font-medium hover:text-primary transition-colors">
              Избранное
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Переключить тему"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm">{user.name}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Выйти">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Войти</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Регистрация</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container px-4 py-4 space-y-2">
            <Link
              to="/recipes"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Рецепты
            </Link>
            <Link
              to="/planner"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Планировщик
            </Link>
            <Link
              to="/shopping-list"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Список покупок
            </Link>
            {user && (
              <>
                <Link
                  to="/favorites"
                  className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Избранное
                </Link>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">{user.name}</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Выйти
                  </Button>
                </div>
              </>
            )}
            {!user && (
              <div className="flex space-x-2 pt-2">
                <Button variant="ghost" asChild className="flex-1">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Войти</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Регистрация</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

