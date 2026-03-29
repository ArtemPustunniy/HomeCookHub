import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import recipesRoutes from './routes/recipes.js'
import plannerRoutes from './routes/planner.js'
import shoppingListRoutes from './routes/shoppingList.js'
import favoritesRoutes from './routes/favorites.js'
import bffRoutes from './routes/bff.js'
import adminRoutes from './routes/admin.js'
import graphqlRouter from './graphql/index.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(
  cors({
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(morgan('dev'))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/recipes', recipesRoutes)
app.use('/planner', plannerRoutes)
app.use('/shopping-list', shoppingListRoutes)
app.use('/favorites', favoritesRoutes)
app.use('/bff', bffRoutes)
app.use('/admin', adminRoutes)
app.use('/graphql', graphqlRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`HomeCookHub API running at http://localhost:${PORT}`)
})
