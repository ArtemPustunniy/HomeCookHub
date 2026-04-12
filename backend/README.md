# HomeCookHub Backend API

Бэкенд на **NestJS** (модули, Guards, ValidationPipe, Swagger, кэш, GraphQL code-first + Apollo).

## Запуск

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

- Сборка: `npm run build`, старт: `npm start` → `node dist/main.js`
- Порт: `PORT` (по умолчанию **3001**)
- Node: см. `engines` в `package.json` (рекомендуется LTS 20+)

Переменные: `DATABASE_URL`, `JWT_SECRET`; для загрузки изображений — блок `S3_*` в `.env.example`.

## Документация API (OpenAPI / Swagger)

После запуска: **http://localhost:3001/api/docs**

- Теги соответствуют модулям
- Авторизация: кнопка **Authorize** → схема **Bearer** (JWT)

## GraphQL (ЛР 5 — code-first)

- **POST /graphql**, схема генерируется из классов (`@ObjectType`, `@InputType`, `@ArgsType`, резолверы)
- В каталоге `dist/graphql/` при старте пишется `schema.gql`
- Ограничения: **глубина** запроса и **сложность** (`graphql-depth-limit`, `graphql-query-complexity`)
- **Field resolvers** для `Recipe.ratings` и `Recipe.comments`
- Песочница: встроенный UI Apollo (Explorer) по адресу `/graphql` в браузере (GET)

## Поведение из лабораторных (папка `conds`)

| Тема | Реализация |
|------|------------|
| ЛР 4 — ValidationPipe, OpenAPI | Глобальный `ValidationPipe`, Swagger, DTO (`auth`, список рецептов) |
| ЛР 4 — пагинация + Link | `GET /recipes`: заголовок `Link` с `rel="next"` / `rel="prev"` |
| ЛР 4 — единый формат ошибок | `AllExceptionsFilter` + Prisma `P2025` → 404 |
| ЛР 5 — GraphQL code-first | Типы и резолверы в `src/graphql/` |
| ЛР 6 — время запроса | `X-Elapsed-Time` (глобальный interceptor) |
| ЛР 6 — кэш | Сервер: `CacheModule` + `CacheInterceptor` на `GET /recipes` (TTL ~5 с); клиент: `ETag` + `Cache-Control` на том же маршруте |
| ЛР 6 — файлы в S3 | `POST /uploads/image` (Bearer), AWS SDK v3, Yandex Object Storage через `S3_ENDPOINT` |
| ЛР 7 — auth / роли | JWT + Passport; **динамический** `AuthModule.forRoot()` (global); Guards; Swagger Bearer |
| ЛР 7 — middleware | `RequestContextMiddleware` + заголовок `X-Request-Id` |

Провайдеры вроде SuperTokens в методичке — **рекомендация**; у нас свой JWT (допустимый вариант «на свой риск») с теми же приёмами Nest (Guards, документация).

## Основные маршруты

- `GET /health`
- `GET /api/docs` — Swagger
- `POST /graphql` — GraphQL
- `POST /uploads/image` — загрузка изображения (нужен S3 в `.env`)
- Остальное — как в **BACKEND_API.md** / **API_REQUESTS.md**

## Данные

**PostgreSQL** + **Prisma** (`prisma/schema.prisma`, `npm run prisma:migrate`).
