# HTTP-запросы к API HomeCookHub

У каждого запроса ниже указаны **два полных URL**:

- **Локально:** `http://localhost:3001` (когда бэк запущен на машине, порт по умолчанию из `backend`).
- **Render (прод):** `https://homecookhub.onrender.com`

Пути, query, заголовки и тела запросов одинаковые; меняется только базовый хост.

Для фронта в `.env`: `VITE_GRAPHQL_HTTP=https://homecookhub.onrender.com/graphql` (или `http://localhost:3001/graphql` локально).

Интерактивная **документация REST (Swagger):** `http://localhost:3001/api/docs` (локально) или `https://homecookhub.onrender.com/api/docs` (Render).

---

## Заголовки

- Для JSON: `Content-Type: application/json`
- Для защищённых маршрутов: `Authorization: Bearer <token>`  
  (`token` из ответа `POST /auth/register` или `POST /auth/login`)

---

## Служебное

### GET — проверка живости

**URL (локально):** `http://localhost:3001/health`  
**URL (Render):** `https://homecookhub.onrender.com/health`

Тело: нет.

---

## Auth

### POST — регистрация

**URL (локально):** `http://localhost:3001/auth/register`  
**URL (Render):** `https://homecookhub.onrender.com/auth/register`

**Тело:**

```json
{
  "name": "Иван Демо",
  "email": "ivan.demo@example.com",
  "password": "secret12"
}
```

Ответ: `201`, поля `token`, `user` (`id`, `name`, `role`).

---

### POST — вход

**URL (локально):** `http://localhost:3001/auth/login`  
**URL (Render):** `https://homecookhub.onrender.com/auth/login`

**Тело:**

```json
{
  "email": "ivan.demo@example.com",
  "password": "secret12"
}
```

Ответ: `200`, `token`, `user`.

---

### GET — текущий пользователь

**URL (локально):** `http://localhost:3001/auth/me`  
**URL (Render):** `https://homecookhub.onrender.com/auth/me`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

### POST — выход (stateless JWT)

**URL (локально):** `http://localhost:3001/auth/logout`  
**URL (Render):** `https://homecookhub.onrender.com/auth/logout`

Тело: нет (клиент после этого удаляет токен).

---

## Рецепты (часть без токена)

### GET — список с фильтрами и пагинацией

**URL (пример с query), локально:**  
`http://localhost:3001/recipes?search=суп&page=1&limit=10&cuisine=Русская&difficulty=medium&tag=quick&maxTime=120`

**URL (пример с query), Render:**  
`https://homecookhub.onrender.com/recipes?search=суп&page=1&limit=10&cuisine=Русская&difficulty=medium&tag=quick&maxTime=120`

Параметры (все опциональны): `search`, `cuisine`, `difficulty`, `tag`, `maxTime`, `page`, `limit`.

**URL (минимум), локально:** `http://localhost:3001/recipes`  
**URL (минимум), Render:** `https://homecookhub.onrender.com/recipes`

Тело: нет.

**Ответ `200`:** `{ "recipes": Recipe[], "total": number }` — массив рецептов и общее число записей для пагинации. В заголовке ответа может быть **`Link`** с ссылками `rel="next"` / `rel="prev"` на соседние страницы.

---

### GET — один рецепт

**URL (локально):** `http://localhost:3001/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА`  
**URL (Render):** `https://homecookhub.onrender.com/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА`

Тело: нет.

---

## Рецепты (нужен Bearer)

### POST — создать рецепт

**URL (локально):** `http://localhost:3001/recipes`  
**URL (Render):** `https://homecookhub.onrender.com/recipes`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:** `authorId` и `authorName` должны совпадать с пользователем из токена (из ответа логина: `user.id`, `user.name`).

```json
{
  "title": "Борщ",
  "cookingTime": 90,
  "difficulty": "medium",
  "cuisine": "Русская",
  "tags": ["dinner", "healthy"],
  "coverImage": "",
  "ingredients": [
    {
      "id": "ing-1",
      "name": "Свёкла",
      "amount": 300,
      "unit": "г"
    },
    {
      "id": "ing-2",
      "name": "Говядина",
      "amount": 400,
      "unit": "г"
    }
  ],
  "instructions": [
    "Подготовить овощи",
    "Варить на медленном огне 60 минут"
  ],
  "nutrition": {
    "calories": 250,
    "protein": 15,
    "carbs": 20,
    "fat": 12,
    "fiber": 4
  },
  "authorId": "ЗАМЕНИТЬ_USER_ID_ИЗ_LOGIN",
  "authorName": "Иван Демо"
}
```

`difficulty`: одно из `easy`, `medium`, `hard`.  
`tags`: значения из доменной схемы, например `vegan`, `quick`, `dinner` (см. `RecipeTag` в `src/types` / `backend/src/types.ts`).

---

### PUT — обновить рецепт (только автор)

**URL (локально):** `http://localhost:3001/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА`  
**URL (Render):** `https://homecookhub.onrender.com/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:** тот же формат, что у POST (полная форма рецепта).

---

### DELETE — удалить рецепт (только автор)

**URL (локально):** `http://localhost:3001/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА`  
**URL (Render):** `https://homecookhub.onrender.com/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет. Ответ: `204`.

---

### POST — комментарий к рецепту

**URL (локально):** `http://localhost:3001/recipes/ЗАМЕНИТЬ_RECIPE_ID/comments`  
**URL (Render):** `https://homecookhub.onrender.com/recipes/ЗАМЕНИТЬ_RECIPE_ID/comments`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:**

```json
{
  "content": "Очень вкусно, готовлю второй раз."
}
```

---

### PATCH — изменить комментарий (только автор комментария)

**URL (локально):** `http://localhost:3001/recipes/ЗАМЕНИТЬ_RECIPE_ID/comments/ЗАМЕНИТЬ_COMMENT_ID`  
**URL (Render):** `https://homecookhub.onrender.com/recipes/ЗАМЕНИТЬ_RECIPE_ID/comments/ЗАМЕНИТЬ_COMMENT_ID`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:**

```json
{
  "content": "Обновлённый текст комментария."
}
```

---

### DELETE — удалить комментарий (только автор)

**URL (локально):** `http://localhost:3001/recipes/ЗАМЕНИТЬ_RECIPE_ID/comments/ЗАМЕНИТЬ_COMMENT_ID`  
**URL (Render):** `https://homecookhub.onrender.com/recipes/ЗАМЕНИТЬ_RECIPE_ID/comments/ЗАМЕНИТЬ_COMMENT_ID`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет. Ответ: `204`.

---

### PUT — поставить / обновить оценку (1–5)

**URL (локально):** `http://localhost:3001/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА/rating`  
**URL (Render):** `https://homecookhub.onrender.com/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА/rating`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:**

```json
{
  "rating": 5
}
```

---

### GET — моя оценка по рецепту

**URL (локально):** `http://localhost:3001/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА/rating`  
**URL (Render):** `https://homecookhub.onrender.com/recipes/ЗАМЕНИТЬ_ID_РЕЦЕПТА/rating`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет. Ответ: `{ "rating": 5 }` или `{ "rating": null }`.

---

## BFF

### GET — агрегат для главной (пользователь + рецепты + избранное + планировщик)

**URL (локально):** `http://localhost:3001/bff/home`  
**URL (Render):** `https://homecookhub.onrender.com/bff/home`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

## Планировщик

`dayIndex`: целое **0–6** (0 — понедельник выбранной недели).

Опциональный query **`weekStart`**: дата понедельника `YYYY-MM-DD`. Если не указан — берётся текущая неделя.

### GET — план на неделю

**URL (локально):** `http://localhost:3001/planner`  
**URL (Render):** `https://homecookhub.onrender.com/planner`

**URL (с неделей), локально:** `http://localhost:3001/planner?weekStart=2026-03-24`  
**URL (с неделей), Render:** `https://homecookhub.onrender.com/planner?weekStart=2026-03-24`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

### POST — добавить рецепт в день

**URL (локально):** `http://localhost:3001/planner/days/0/recipes?weekStart=2026-03-24`  
**URL (Render):** `https://homecookhub.onrender.com/planner/days/0/recipes?weekStart=2026-03-24`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:**

```json
{
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА"
}
```

---

### DELETE — убрать рецепт из дня

**URL (локально):** `http://localhost:3001/planner/days/0/recipes/ЗАМЕНИТЬ_RECIPE_ID?weekStart=2026-03-24`  
**URL (Render):** `https://homecookhub.onrender.com/planner/days/0/recipes/ЗАМЕНИТЬ_RECIPE_ID?weekStart=2026-03-24`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

### PATCH — перенести рецепт между днями

**URL (локально):** `http://localhost:3001/planner/recipes/ЗАМЕНИТЬ_RECIPE_ID/move`  
**URL (Render):** `https://homecookhub.onrender.com/planner/recipes/ЗАМЕНИТЬ_RECIPE_ID/move`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:**

```json
{
  "weekStart": "2026-03-24",
  "fromDayIndex": 0,
  "toDayIndex": 3
}
```

---

### DELETE — очистить один день

**URL (локально):** `http://localhost:3001/planner/days/2?weekStart=2026-03-24`  
**URL (Render):** `https://homecookhub.onrender.com/planner/days/2?weekStart=2026-03-24`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

### DELETE — очистить всю неделю

**URL (локально):** `http://localhost:3001/planner/week?weekStart=2026-03-24`  
**URL (Render):** `https://homecookhub.onrender.com/planner/week?weekStart=2026-03-24`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

## Список покупок

### GET — текущий список

**URL (локально):** `http://localhost:3001/shopping-list`  
**URL (Render):** `https://homecookhub.onrender.com/shopping-list`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

### POST — сгенерировать из рецептов

**URL (локально):** `http://localhost:3001/shopping-list/generate`  
**URL (Render):** `https://homecookhub.onrender.com/shopping-list/generate`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:**

```json
{
  "recipeIds": [
    "ЗАМЕНИТЬ_ID_РЕЦЕПТА_1",
    "ЗАМЕНИТЬ_ID_РЕЦЕПТА_2"
  ]
}
```

---

### POST — добавить позицию вручную

**URL (локально):** `http://localhost:3001/shopping-list/items`  
**URL (Render):** `https://homecookhub.onrender.com/shopping-list/items`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:**

```json
{
  "name": "Молоко",
  "amount": 1,
  "unit": "л"
}
```

`amount` и `unit` можно опустить.

---

### PATCH — обновить позицию

**URL (локально):** `http://localhost:3001/shopping-list/items/ЗАМЕНИТЬ_ITEM_ID`  
**URL (Render):** `https://homecookhub.onrender.com/shopping-list/items/ЗАМЕНИТЬ_ITEM_ID`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело (любые из полей):**

```json
{
  "name": "Молоко 3.2%",
  "amount": 2,
  "unit": "л",
  "purchased": true
}
```

---

### DELETE — удалить позицию

**URL (локально):** `http://localhost:3001/shopping-list/items/ЗАМЕНИТЬ_ITEM_ID`  
**URL (Render):** `https://homecookhub.onrender.com/shopping-list/items/ЗАМЕНИТЬ_ITEM_ID`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

### PATCH — переключить «куплено»

**URL (локально):** `http://localhost:3001/shopping-list/items/ЗАМЕНИТЬ_ITEM_ID/toggle-purchased`  
**URL (Render):** `https://homecookhub.onrender.com/shopping-list/items/ЗАМЕНИТЬ_ITEM_ID/toggle-purchased`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

### DELETE — очистить весь список

**URL (локально):** `http://localhost:3001/shopping-list`  
**URL (Render):** `https://homecookhub.onrender.com/shopping-list`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

## Избранное

### GET — все id избранных рецептов

**URL (локально):** `http://localhost:3001/favorites`  
**URL (Render):** `https://homecookhub.onrender.com/favorites`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

**Ответ `200`:** `{ "recipeIds": ["...", "..."] }` — только массив id (без поля `userId`, в отличие от ответа GraphQL `favorites { userId recipeIds }`).

---

### POST — добавить в избранное

**URL (локально):** `http://localhost:3001/favorites`  
**URL (Render):** `https://homecookhub.onrender.com/favorites`

**Заголовки:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Тело:**

```json
{
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА"
}
```

---

### DELETE — убрать из избранного

**URL (локально):** `http://localhost:3001/favorites/ЗАМЕНИТЬ_RECIPE_ID`  
**URL (Render):** `https://homecookhub.onrender.com/favorites/ЗАМЕНИТЬ_RECIPE_ID`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет.

---

### GET — проверка, в избранном ли рецепт

**URL (локально):** `http://localhost:3001/favorites/ЗАМЕНИТЬ_RECIPE_ID`  
**URL (Render):** `https://homecookhub.onrender.com/favorites/ЗАМЕНИТЬ_RECIPE_ID`

**Заголовки:** `Authorization: Bearer <token>`

Тело: нет. Ответ: `{ "isFavorite": true }`.

---

## Админ (нужен пользователь с `role: admin` в БД)

### GET — список пользователей

**URL (локально):** `http://localhost:3001/admin/users`  
**URL (Render):** `https://homecookhub.onrender.com/admin/users`

**Заголовки:** `Authorization: Bearer <token_админа>`

Тело: нет.

---

## Загрузка изображения (REST, опционально)

Если в окружении настроено S3-совместимое хранилище, можно получить URL для поля `coverImage`.

### POST — загрузить файл

**URL (локально):** `http://localhost:3001/uploads/image`  
**URL (Render):** `https://homecookhub.onrender.com/uploads/image`

**Заголовки:** `Authorization: Bearer <token>`  
**Тело:** `multipart/form-data`, поле формы **`file`** (jpeg / png / gif / webp).

В Postman: **Body** → **form-data** → ключ `file`, тип **File**.

**Ответ `201`:** `{ "url": "...", "key": "..." }`. Если хранилище не настроено — `503`.

---

## GraphQL (один эндпоинт)

Схема **code-first** (NestJS): актуальные типы и операции смотри в файле, который генерируется при сборке бэкенда: **`backend/dist/graphql/schema.gql`** (после `npm run build` в каталоге `backend`). В репозитории его может не быть, пока не соберёшь проект.

### POST — произвольный query / mutation

**URL (локально):** `http://localhost:3001/graphql`  
**URL (Render):** `https://homecookhub.onrender.com/graphql`

**Postman:** метод **POST**.

- Режим **Body → GraphQL** — вставляй запросы из подраздела **«Примеры под localhost:3001/graphql»** (поля **QUERY** и **GRAPHQL VARIABLES**).
- Режим **Body → raw → JSON** — один объект с полями **`query`**, опционально **`variables`**, опционально **`operationName`** (см. блоки ниже).

Заголовок **`Content-Type: application/json`** (Postman часто ставит сам). Для защищённых операций: **`Authorization: Bearer <token>`**.

Входная форма рецепта в схеме называется **`RecipeFormInputModel`** (не `RecipeFormInput`). Аргумент мутации — **`input`**, в переменных удобно назвать объект, например, **`recipeInput`**.

---

### Примеры под `http://localhost:3001/graphql` (Postman → Body → GraphQL)

**Общее:** метод **POST**, URL **`http://localhost:3001/graphql`**.  
Ниже: поле **QUERY** и (если нужно) **GRAPHQL VARIABLES** — вставляй как есть, подставляй свои id из ответов `recipes` / `createRecipe` / логина.

Запросы **без токена:** публичный список и один рецепт.  
**С токеном:** вкладка **Authorization → Bearer Token** (токен из `POST /auth/login`).

#### 1. Список рецептов (пагинация, фильтры)

**QUERY**

```graphql
query RecipesList {
  recipes(page: 1, limit: 10, search: "бор", cuisine: "Русская", difficulty: "medium", tag: "dinner", maxTime: 120) {
    total
    items {
      id
      title
      cookingTime
      difficulty
      cuisine
      tags
    }
  }
}
```

**GRAPHQL VARIABLES:** не нужны (оставь `{}` или пусто).

---

#### 2. Один рецепт по id

**QUERY**

```graphql
query OneRecipe($id: ID!) {
  recipe(id: $id) {
    id
    title
    cookingTime
    difficulty
    cuisine
    tags
    coverImage
    ingredients {
      id
      name
      amount
      unit
    }
    instructions
    nutrition {
      calories
      protein
      carbs
      fat
      fiber
    }
    authorId
    authorName
    averageRating
    ratingCount
    createdAt
    updatedAt
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "id": "ЗАМЕНИТЬ_ID_РЕЦЕПТА"
}
```

---

#### 3. Текущий пользователь (`me`)

**QUERY**

```graphql
query Me {
  me {
    id
    name
    role
  }
}
```

**GRAPHQL VARIABLES:** `{}`  
**Нужен Bearer.**

---

#### 4. Избранное

**QUERY**

```graphql
query MyFavorites {
  favorites {
    userId
    recipeIds
  }
}
```

**GRAPHQL VARIABLES:** `{}` · **Bearer.**

---

#### 5. Рецепт в избранном? + моя оценка

**QUERY**

```graphql
query RecipeMeta($recipeId: ID!) {
  isFavorite(recipeId: $recipeId)
  recipeRating(recipeId: $recipeId)
}
```

**GRAPHQL VARIABLES**

```json
{
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА"
}
```

**Bearer.**

---

#### 6. Планировщик на неделю

**QUERY**

```graphql
query MyPlanner($weekStart: String) {
  planner(weekStart: $weekStart) {
    weekStart
    days {
      date
      recipeIds
    }
  }
}
```

**GRAPHQL VARIABLES** (понедельник недели `YYYY-MM-DD`; можно `null` — текущая неделя)

```json
{
  "weekStart": "2026-03-24"
}
```

**Bearer.**

---

#### 7. Список покупок

**QUERY**

```graphql
query MyShoppingList {
  shoppingList {
    id
    createdAt
    updatedAt
    items {
      id
      name
      amount
      unit
      purchased
    }
  }
}
```

**GRAPHQL VARIABLES:** `{}` · **Bearer.**

---

#### 8. Создать рецепт

**QUERY**

```graphql
mutation CreateRecipe($recipeInput: RecipeFormInputModel!) {
  createRecipe(input: $recipeInput) {
    id
    title
    cookingTime
    difficulty
    cuisine
    tags
    coverImage
    ingredients {
      id
      name
      amount
      unit
    }
    instructions
    nutrition {
      calories
      protein
      carbs
      fat
      fiber
    }
    authorId
    authorName
    createdAt
    updatedAt
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "recipeInput": {
    "title": "Суп из Postman",
    "cookingTime": 45,
    "difficulty": "easy",
    "cuisine": "Домашняя",
    "tags": ["quick", "lunch"],
    "coverImage": "",
    "ingredients": [
      { "id": "ing-post-1", "name": "Вода", "amount": 2, "unit": "л" }
    ],
    "instructions": ["Вскипятить", "Посолить"],
    "nutrition": {
      "calories": 100,
      "protein": 5,
      "carbs": 10,
      "fat": 2,
      "fiber": 1
    }
  }
}
```

**Bearer.** `difficulty`: `easy` \| `medium` \| `hard`. Теги — из `RecipeTag` в `backend/src/types.ts`.

---

#### 9. Обновить рецепт (только автор)

**QUERY**

```graphql
mutation UpdateRecipe($id: ID!, $recipeInput: RecipeFormInputModel!) {
  updateRecipe(id: $id, input: $recipeInput) {
    id
    title
    updatedAt
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "id": "ЗАМЕНИТЬ_ID_РЕЦЕПТА",
  "recipeInput": {
    "title": "Суп (обновлённо)",
    "cookingTime": 50,
    "difficulty": "medium",
    "cuisine": "Домашняя",
    "tags": ["lunch"],
    "coverImage": "",
    "ingredients": [{ "id": "ing-post-1", "name": "Вода", "amount": 2, "unit": "л" }],
    "instructions": ["Вскипятить", "Добавить специи"]
  }
}
```

**Bearer.**

---

#### 10. Удалить рецепт (только автор)

**QUERY**

```graphql
mutation DeleteRecipe($id: ID!) {
  deleteRecipe(id: $id)
}
```

**GRAPHQL VARIABLES**

```json
{
  "id": "ЗАМЕНИТЬ_ID_РЕЦЕПТА"
}
```

**Bearer.**

---

#### 11. Оценка 1–5

**QUERY**

```graphql
mutation SetRating($recipeId: ID!, $rating: Int!) {
  setRating(recipeId: $recipeId, rating: $rating) {
    id
    averageRating
    ratingCount
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА",
  "rating": 5
}
```

**Bearer.**

---

#### 12. Комментарий: добавить / обновить / удалить

**QUERY — добавить**

```graphql
mutation AddComment($recipeId: ID!, $content: String!) {
  addComment(recipeId: $recipeId, content: $content) {
    id
    recipeId
    authorId
    authorName
    content
    createdAt
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА",
  "content": "Очень вкусно."
}
```

**QUERY — обновить**

```graphql
mutation UpdateComment($recipeId: ID!, $commentId: ID!, $content: String!) {
  updateComment(recipeId: $recipeId, commentId: $commentId, content: $content) {
    id
    content
    updatedAt
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА",
  "commentId": "ЗАМЕНИТЬ_COMMENT_ID",
  "content": "Обновлённый текст."
}
```

**QUERY — удалить**

```graphql
mutation DeleteComment($recipeId: ID!, $commentId: ID!) {
  deleteComment(recipeId: $recipeId, commentId: $commentId)
}
```

**GRAPHQL VARIABLES**

```json
{
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА",
  "commentId": "ЗАМЕНИТЬ_COMMENT_ID"
}
```

**Bearer** для всех трёх.

---

#### 13. Избранное: добавить / убрать

**QUERY — добавить**

```graphql
mutation AddFavorite($recipeId: ID!) {
  addFavorite(recipeId: $recipeId) {
    userId
    recipeIds
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА"
}
```

**QUERY — убрать**

```graphql
mutation RemoveFavorite($recipeId: ID!) {
  removeFavorite(recipeId: $recipeId) {
    userId
    recipeIds
  }
}
```

**(те же variables)** · **Bearer.**

---

#### 14. Планировщик: добавить рецепт в день / убрать / перенести / очистить

**QUERY — добавить в день** (`dayIndex` 0–6, 0 — понедельник выбранной недели)

```graphql
mutation AddToPlanner($dayIndex: Int!, $recipeId: ID!, $weekStart: String) {
  addRecipeToPlanner(dayIndex: $dayIndex, recipeId: $recipeId, weekStart: $weekStart) {
    weekStart
    days {
      date
      recipeIds
    }
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "dayIndex": 0,
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА",
  "weekStart": "2026-03-24"
}
```

**QUERY — убрать из дня**

```graphql
mutation RemoveFromPlanner($dayIndex: Int!, $recipeId: ID!, $weekStart: String) {
  removeRecipeFromPlanner(dayIndex: $dayIndex, recipeId: $recipeId, weekStart: $weekStart) {
    weekStart
    days {
      date
      recipeIds
    }
  }
}
```

**(те же variables, при необходимости смени dayIndex / recipeId)**

**QUERY — перенести между днями** (`weekStart` здесь обязателен в схеме)

```graphql
mutation MoveInPlanner($recipeId: ID!, $weekStart: String!, $fromDayIndex: Int!, $toDayIndex: Int!) {
  moveRecipeInPlanner(recipeId: $recipeId, weekStart: $weekStart, fromDayIndex: $fromDayIndex, toDayIndex: $toDayIndex) {
    weekStart
    days {
      date
      recipeIds
    }
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА",
  "weekStart": "2026-03-24",
  "fromDayIndex": 0,
  "toDayIndex": 3
}
```

**QUERY — очистить один день**

```graphql
mutation ClearPlannerDay($dayIndex: Int!, $weekStart: String) {
  clearPlannerDay(dayIndex: $dayIndex, weekStart: $weekStart) {
    weekStart
    days {
      date
      recipeIds
    }
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "dayIndex": 2,
  "weekStart": "2026-03-24"
}
```

**QUERY — очистить неделю**

```graphql
mutation ClearPlannerWeek($weekStart: String) {
  clearPlannerWeek(weekStart: $weekStart) {
    weekStart
    days {
      date
      recipeIds
    }
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "weekStart": "2026-03-24"
}
```

**Bearer** для всех мутаций планировщика.

---

#### 15. Список покупок: сгенерировать / пункт / удалить / очистить

**QUERY — сгенерировать из рецептов**

```graphql
mutation GenShoppingList($recipeIds: [ID!]!) {
  generateShoppingList(recipeIds: $recipeIds) {
    id
    items {
      id
      name
      amount
      unit
      purchased
    }
    updatedAt
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "recipeIds": ["ЗАМЕНИТЬ_ID_1", "ЗАМЕНИТЬ_ID_2"]
}
```

**QUERY — добавить позицию вручную**

```graphql
mutation AddListItem($name: String!, $amount: Float, $unit: String) {
  addShoppingListItem(name: $name, amount: $amount, unit: $unit) {
    id
    items {
      id
      name
      amount
      unit
      purchased
    }
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "name": "Молоко",
  "amount": 1,
  "unit": "л"
}
```

**QUERY — обновить позицию**

```graphql
mutation UpdateListItem($itemId: ID!, $name: String, $amount: Float, $unit: String, $purchased: Boolean) {
  updateShoppingListItem(itemId: $itemId, name: $name, amount: $amount, unit: $unit, purchased: $purchased) {
    id
    items {
      id
      name
      amount
      unit
      purchased
    }
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "itemId": "ЗАМЕНИТЬ_ITEM_ID",
  "name": "Молоко 3.2%",
  "amount": 2,
  "unit": "л",
  "purchased": true
}
```

**QUERY — переключить «куплено»**

```graphql
mutation TogglePurchased($itemId: ID!) {
  toggleShoppingListItemPurchased(itemId: $itemId) {
    id
    items {
      id
      purchased
    }
  }
}
```

**GRAPHQL VARIABLES**

```json
{
  "itemId": "ЗАМЕНИТЬ_ITEM_ID"
}
```

**QUERY — удалить позицию**

```graphql
mutation DeleteListItem($itemId: ID!) {
  deleteShoppingListItem(itemId: $itemId) {
    id
    items {
      id
      name
    }
  }
}
```

**QUERY — очистить весь список**

```graphql
mutation ClearList {
  clearShoppingList {
    id
    items {
      id
    }
  }
}
```

**GRAPHQL VARIABLES для удаления позиции:** `{ "itemId": "..." }` · для `clearList` — `{}` · **Bearer** для всего блока.

---

### Тот же эндпоинт в Postman как **raw JSON** (Body → raw)

Если не используешь вкладку **GraphQL**, собери одно тело: `{ "query": "строка...", "variables": { ... }, "operationName": "..." }` — примеры ниже.

**Тело — пример query (список рецептов):**

```json
{
  "query": "query { recipes(page: 1, limit: 5) { total items { id title cookingTime difficulty } } }"
}
```

**Тело — пример query (один рецепт):**

```json
{
  "query": "query One($id: ID!) { recipe(id: $id) { id title ingredients { name amount unit } } }",
  "variables": {
    "id": "ЗАМЕНИТЬ_ID_РЕЦЕПТА"
  }
}
```

**Тело — пример mutation «создать рецепт» (нужен `Authorization: Bearer`):**

```json
{
  "operationName": "CreateRecipe",
  "query": "mutation CreateRecipe($recipeInput: RecipeFormInputModel!) { createRecipe(input: $recipeInput) { id title cookingTime difficulty cuisine tags coverImage ingredients { id name amount unit } instructions nutrition { calories protein carbs fat fiber } authorId authorName createdAt updatedAt } }",
  "variables": {
    "recipeInput": {
      "title": "Суп из Postman",
      "cookingTime": 45,
      "difficulty": "easy",
      "cuisine": "Домашняя",
      "tags": ["quick", "lunch"],
      "coverImage": "",
      "ingredients": [
        { "id": "i1", "name": "Вода", "amount": 2, "unit": "л" }
      ],
      "instructions": ["Вскипятить", "Посолить"],
      "nutrition": {
        "calories": 100,
        "protein": 5,
        "carbs": 10,
        "fat": 2,
        "fiber": 1
      }
    }
  }
}
```

`difficulty`: `easy` | `medium` | `hard`. Теги — из доменного набора (`vegan`, `quick`, `dinner`, …), см. `RecipeTag` в `backend/src/types.ts`. Поля **`nutrition`**, **`tags`**, **`coverImage`** можно опустить или задать `coverImage: ""`.

**Тело — пример mutation «обновить рецепт» (только автор, нужен Bearer):**

```json
{
  "operationName": "UpdateRecipe",
  "query": "mutation UpdateRecipe($id: ID!, $recipeInput: RecipeFormInputModel!) { updateRecipe(id: $id, input: $recipeInput) { id title } }",
  "variables": {
    "id": "ЗАМЕНИТЬ_ID_РЕЦЕПТА",
    "recipeInput": {
      "title": "Суп (обновлённо)",
      "cookingTime": 50,
      "difficulty": "medium",
      "cuisine": "Домашняя",
      "tags": ["lunch"],
      "coverImage": "",
      "ingredients": [{ "id": "i1", "name": "Вода", "amount": 2, "unit": "л" }],
      "instructions": ["Вскипятить", "Добавить специи"]
    }
  }
}
```

**Тело — пример mutation «оценка 1–5» (GraphQL; нужен Bearer):**

```json
{
  "query": "mutation SetRating($recipeId: ID!, $rating: Int!) { setRating(recipeId: $recipeId, rating: $rating) { id averageRating ratingCount } }",
  "variables": {
    "recipeId": "ЗАМЕНИТЬ_ID_РЕЦЕПТА",
    "rating": 5
  }
}
```

(Через REST та же операция: **`PUT /recipes/:id/rating`** с телом `{ "rating": 5 }`.)

**Тело — пример query `me` (текущий пользователь из JWT, обязателен `Authorization: Bearer`):**

```json
{
  "query": "query { me { id name role } }"
}
```

**Тело — пример query избранного (тоже только с токеном):**

```json
{
  "query": "query { favorites { userId recipeIds } }"
}
```

**Тело — пример mutation «добавить в избранное»:**

```json
{
  "query": "mutation AddFav($id: ID!) { addFavorite(recipeId: $id) { userId recipeIds } }",
  "variables": {
    "id": "ЗАМЕНИТЬ_ID_РЕЦЕПТА"
  }
}
```

**Ответ GraphQL:** чаще всего HTTP **200**, даже при ошибке выполнения: смотри массив **`errors`** в JSON; поле **`data`** может быть `null`.

---

## Замечание про Render

На бесплатном тарифе первый запрос после простоя может занять **10–30 с** (cold start). Это нормально для `https://homecookhub.onrender.com`.
