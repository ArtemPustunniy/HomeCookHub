# Спецификация Backend API HomeCookHub

## 1. Рецепты (Recipes)

**Модель (для справки):** id, title, cookingTime (мин), difficulty (easy | medium | hard), cuisine, tags (массив тегов), coverImage (URL или пустая строка), ingredients (массив { id, name, amount?, unit? }), instructions (массив строк), nutrition? (calories, protein, carbs, fat, fiber), authorId, authorName, averageRating, ratingCount, ratings (массив { userId, rating }), comments (массив Comment), createdAt, updatedAt.

### 1.1 Список рецептов (с фильтрами и пагинацией)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/recipes` | Список рецептов с опциональными query-параметрами |

**Query-параметры (все опциональны):**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `search` | string | Поиск по названию (подстрока, без учёта регистра) |
| `cuisine` | string | Фильтр по кухне (точное совпадение) |
| `difficulty` | string | `easy` \| `medium` \| `hard` |
| `tag` | string | Один тег (vegan, vegetarian, quick и т.д.) |
| `maxTime` | number | Максимальное время приготовления в минутах |
| `page` | number | Номер страницы (начиная с 1), по умолчанию 1 |
| `limit` | number | Размер страницы (например 12), по умолчанию 12 |

**Ответ 200:**  
`{ "recipes": Recipe[], "total": number }`  
- `recipes` — массив рецептов (можно без полей ratings/comments для списка, если нужна облегчённая модель).  
- `total` — общее количество записей для пагинации.

---

### 1.2 Один рецепт по ID

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/recipes/:id` | Получить рецепт по ID |

**Параметры пути:** `id` — ID рецепта.

**Ответ 200:** объект `Recipe` (полная модель с ratings и comments).  
**Ответ 404:** если рецепт не найден.

---

### 1.3 Создать рецепт

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/recipes` | Создать рецепт (требуется авторизация) |

**Тело запроса (RecipeForm):**  
Без `id`, `createdAt`, `updatedAt`, `averageRating`, `ratingCount`, `ratings`, `comments`. Обязательные поля: title, cookingTime, difficulty, cuisine, ingredients (минимум 1), instructions (минимум 1), authorId, authorName. Остальное по текущей схеме RecipeFormSchema в `src/types/index.ts`.

**Ответ 201:** созданный объект `Recipe` (с id, createdAt, updatedAt, averageRating: 0, ratingCount: 0, ratings: [], comments: []).  
**Ответ 400:** ошибки валидации.  
**Ответ 401:** не авторизован.

---

### 1.4 Обновить рецепт

| Метод | Путь | Описание |
|-------|------|----------|
| PUT | `/recipes/:id` | Обновить рецепт (только автор) |

**Тело запроса:** тот же контракт, что и при создании (RecipeForm).  
**Ответ 200:** обновлённый `Recipe`.  
**Ответ 403:** не автор рецепта.  
**Ответ 404:** рецепт не найден.

---

### 1.5 Удалить рецепт

| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/recipes/:id` | Удалить рецепт (только автор) |

**Ответ 204:** без тела.  
**Ответ 403 / 404:** как выше.

---

### 1.6 Комментарии к рецепту

**Добавить комментарий**

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/recipes/:recipeId/comments` | Добавить комментарий (авторизация) |

**Тело:** `{ "content": string }`. На сервере подставляются authorId, authorName (из сессии/токена), recipeId, id, createdAt.

**Ответ 201:** созданный объект `Comment` (id, recipeId, authorId, authorName, content, createdAt).

---

**Обновить комментарий**

| Метод | Путь | Описание |
|-------|------|----------|
| PATCH | `/recipes/:recipeId/comments/:commentId` | Обновить комментарий (только автор) |

**Тело:** `{ "content": string }`.  
**Ответ 200:** обновлённый `Comment`.  
**Ответ 403 / 404:** как обычно.

---

**Удалить комментарий**

| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/recipes/:recipeId/comments/:commentId` | Удалить комментарий (только автор) |

**Ответ 204.**  
**Ответ 403 / 404:** как обычно.

---

### 1.7 Рейтинг рецепта

**Поставить или обновить оценку**

| Метод | Путь | Описание |
|-------|------|----------|
| PUT | `/recipes/:id/rating` | Поставить оценку 1–5 (авторизация) |

**Тело:** `{ "rating": number }` (1–5).  
**Ответ 200:** обновлённый `Recipe` (пересчитанные averageRating, ratingCount, массив ratings).

---

**Получить оценку текущего пользователя**

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/recipes/:id/rating` | Оценка текущего пользователя для рецепта |

**Ответ 200:** `{ "rating": number | null }` (null, если пользователь не оценивал).

---

## 2. Планировщик (Planner)

**Модель:** weekStart (ISO date, понедельник), days — массив из 7 элементов: `{ date: string (ISO), recipeIds: string[] }`.

### 2.1 Получить планировщик на неделю

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/planner` | Планировщик на текущую неделю (понедельник) |

**Query (опционально):** `weekStart` — дата понедельника в формате `YYYY-MM-DD`. Если не передан — текущая неделя.

**Ответ 200:** объект `Planner` (weekStart, days[7]). Если записи нет — сервер может вернуть «пустой» планировщик с пустыми `recipeIds` в каждом дне.

---

### 2.2 Добавить рецепт в день

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/planner/days/:dayIndex/recipes` | Привязать рецепт к дню недели |

**Параметры пути:** `dayIndex` — 0..6 (пн–вс).  
**Query:** `weekStart` — `YYYY-MM-DD` (понедельник).  
**Тело:** `{ "recipeId": string }`.  
**Ответ 200:** обновлённый `Planner`.

---

### 2.3 Удалить рецепт из дня

| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/planner/days/:dayIndex/recipes/:recipeId` | Убрать рецепт из дня |

**Query:** `weekStart`.  
**Ответ 200:** обновлённый `Planner`.

---

### 2.4 Переместить рецепт между днями

| Метод | Путь | Описание |
|-------|------|----------|
| PATCH | `/planner/recipes/:recipeId/move` | Перенести рецепт из одного дня в другой |

**Тело:** `{ "weekStart": string, "fromDayIndex": number, "toDayIndex": number }`.  
**Ответ 200:** обновлённый `Planner`.

---

### 2.5 Очистить день / неделю

| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/planner/days/:dayIndex` | Очистить один день (query: weekStart) |
| DELETE | `/planner/week` | Очистить всю неделю (query: weekStart) |

**Ответ 200:** обновлённый `Planner`.

---

## 3. Список покупок (Shopping List)

**Модель:** id, items (массив ShoppingListItem), createdAt, updatedAt.  
**ShoppingListItem:** id, name, amount?, unit?, purchased (boolean).

### 3.1 Получить список покупок

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/shopping-list` | Текущий список покупок пользователя |

**Ответ 200:** объект `ShoppingList`. Если списка нет — можно вернуть пустой (items: []).

---

### 3.2 Сгенерировать список из планировщика

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/shopping-list/generate` | Построить список из выбранных в планировщике рецептов |

**Тело:** `{ "recipeIds": string[] }`.  
Логика: объединение ингредиентов по названию (и при совпадении единиц — суммирование количества).  
**Ответ 200:** обновлённый `ShoppingList`.

---

### 3.3 Добавить позицию вручную

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/shopping-list/items` | Добавить элемент списка |

**Тело:** `{ "name": string, "amount"?: number, "unit"?: string }` (purchased по умолчанию false).  
**Ответ 201:** обновлённый `ShoppingList` или созданный `ShoppingListItem` — на выбор контракта.

---

### 3.4 Обновить позицию

| Метод | Путь | Описание |
|-------|------|----------|
| PATCH | `/shopping-list/items/:itemId` | Обновить имя, количество, единицу или purchased |

**Тело:** Partial<ShoppingListItem> (id не перезаписывать).  
**Ответ 200:** обновлённый `ShoppingList` или объект item.

---

### 3.5 Удалить позицию

| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/shopping-list/items/:itemId` | Удалить элемент |

**Ответ 200:** обновлённый `ShoppingList` или 204 без тела.

---

### 3.6 Переключить «куплено»

| Метод | Путь | Описание |
|-------|------|----------|
| PATCH | `/shopping-list/items/:itemId/toggle-purchased` | Инвертировать purchased |

**Ответ 200:** обновлённый элемент или список.

---

### 3.7 Очистить список

| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/shopping-list` | Очистить все позиции |

**Ответ 200:** обновлённый `ShoppingList` (items: []).

---

## 4. Избранное (Favorites)

**Модель:** userId, recipeIds (string[]).

### 4.1 Получить избранное пользователя

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/favorites` | Список ID избранных рецептов текущего пользователя |

**Ответ 200:** `{ "recipeIds": string[] }` или объект `Favorites`.

---

### 4.2 Добавить в избранное

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/favorites` | Добавить рецепт в избранное |

**Тело:** `{ "recipeId": string }`.  
**Ответ 200:** обновлённый объект избранного (recipeIds).

---

### 4.3 Удалить из избранного

| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/favorites/:recipeId` | Убрать рецепт из избранного |

**Ответ 200:** обновлённый объект избранного.

---

### 4.4 Проверить, в избранном ли рецепт

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/favorites/:recipeId` | Проверка наличия рецепта в избранном |

**Ответ 200:** `{ "isFavorite": boolean }`.

---

## 5. Пользователи / Сессия (опционально)

Если бэкенд управляет сессией и пользователями (вместо хранения только id/name на клиенте):

### 5.1 Регистрация / Вход

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/register` | Регистрация: тело `{ "name": string, "email"?: string, "password"?: string }` |
| POST | `/auth/login` | Вход: тело `{ "name": string }` или email/password; ответ — токен или установка cookie |

**Ответ:** токен (JWT) или cookie сессии + объект пользователя `{ id, name }`.

### 5.2 Текущий пользователь / Выход

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/auth/me` | Текущий пользователь по токену/сессии |
| POST | `/auth/logout` | Выход (инвалидация сессии) |

---

## Сводная таблица эндпоинтов

| Группа | Метод | Путь |
|--------|--------|------|
| Recipes | GET | /recipes |
| Recipes | GET | /recipes/:id |
| Recipes | POST | /recipes |
| Recipes | PUT | /recipes/:id |
| Recipes | DELETE | /recipes/:id |
| Comments | POST | /recipes/:recipeId/comments |
| Comments | PATCH | /recipes/:recipeId/comments/:commentId |
| Comments | DELETE | /recipes/:recipeId/comments/:commentId |
| Rating | PUT | /recipes/:id/rating |
| Rating | GET | /recipes/:id/rating |
| Planner | GET | /planner |
| Planner | POST | /planner/days/:dayIndex/recipes |
| Planner | DELETE | /planner/days/:dayIndex/recipes/:recipeId |
| Planner | PATCH | /planner/recipes/:recipeId/move |
| Planner | DELETE | /planner/days/:dayIndex |
| Planner | DELETE | /planner/week |
| Shopping | GET | /shopping-list |
| Shopping | POST | /shopping-list/generate |
| Shopping | POST | /shopping-list/items |
| Shopping | PATCH | /shopping-list/items/:itemId |
| Shopping | DELETE | /shopping-list/items/:itemId |
| Shopping | PATCH | /shopping-list/items/:itemId/toggle-purchased |
| Shopping | DELETE | /shopping-list |
| Favorites | GET | /favorites |
| Favorites | POST | /favorites |
| Favorites | DELETE | /favorites/:recipeId |
| Favorites | GET | /favorites/:recipeId |
| Auth (опц.) | POST | /auth/register, /auth/login, GET /auth/me, POST /auth/logout |
