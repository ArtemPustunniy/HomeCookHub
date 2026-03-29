# HomeCookHub Backend API

Отдельный бэкенд для приложения HomeCookHub. Запускается независимо; фронтенд подключается к нему по URL (например `http://localhost:3001`).

## Запуск

```bash
cd backend
npm install
npm run dev
```

Сервер будет доступен по адресу **http://localhost:3001**. Переменная окружения `PORT` задаёт порт (по умолчанию 3001).

## Авторизация

Эндпоинты, требующие авторизации, ожидают заголовок:

```
Authorization: Bearer <token>
```

Получить токен: `POST /auth/login` с телом `{ "name": "Имя" }` или `POST /auth/register` с телом `{ "name": "Имя" }`. В ответ приходит `{ token, user: { id, name } }`.

## Эндпоинты

- **Recipes:** `GET/POST /recipes`, `GET/PUT/DELETE /recipes/:id`, комментарии и рейтинг по спецификации.
- **Planner:** `GET /planner`, `POST /planner/days/:dayIndex/recipes`, `DELETE /planner/days/:dayIndex/recipes/:recipeId`, `PATCH /planner/recipes/:recipeId/move`, `DELETE /planner/days/:dayIndex`, `DELETE /planner/week`.
- **Shopping list:** `GET/POST /shopping-list/generate`, `POST/PATCH/DELETE /shopping-list/items`, `PATCH .../items/:itemId/toggle-purchased`, `DELETE /shopping-list`.
- **Favorites:** `GET/POST /favorites`, `GET/DELETE /favorites/:recipeId`.
- **Auth:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.

Полная спецификация — в корне проекта: **BACKEND_API.md**.

## Хранение данных

Сейчас данные хранятся в памяти (при перезапуске сбрасываются). Для продакшена можно подключить БД (Postgres и т.п.) и заменить слой в `src/store.ts`.
