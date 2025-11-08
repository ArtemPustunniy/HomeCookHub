import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProvider } from '@/contexts/UserContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Recipes } from '@/pages/Recipes'
import { RecipeDetail } from '@/pages/RecipeDetail'
import { RecipeForm } from '@/pages/RecipeForm'
import { Planner } from '@/pages/Planner'
import { ShoppingList } from '@/pages/ShoppingList'
import { Favorites } from '@/pages/Favorites'
import { initializeDefaultRecipes } from '@/services/recipeService'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  useEffect(() => {
    initializeDefaultRecipes()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/recipes/:id" element={<RecipeDetail />} />
                <Route path="/recipes/new" element={<RecipeForm />} />
                <Route path="/recipes/:id/edit" element={<RecipeForm />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/shopping-list" element={<ShoppingList />} />
                <Route path="/favorites" element={<Favorites />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
