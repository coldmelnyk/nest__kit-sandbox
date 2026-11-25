# 001. Реализовать роли kit

- **Когда:** 2026-11-25
- **Ветка:** `feature/shared-roles`
- **Источник:** правила `.claude/rules/kit/` после установки claude-kit (`Д-1`); первая прикладная задача — главная страница (`002-home-page-content.md`) — опирается на роли
- **Оценка:** 1 день
- **Внешние зависимости:** runtime-зависимости согласованы владельцем (`Р-1`); локальный PostgreSQL — `docker-compose.yml`

## Зачем

Правила уже требуют получать время, id, конфигурацию, журнал, доступ к базе и тестовую оснастку только через роли. Пока реализаций нет, новому коду не на что опереться.

## Предложено (подтвердить)

- Если `NODE_ENV` не задан, приложение считает окружение `dev`: иначе `npm run start:dev` на машине разработчика требует ставить переменную руками, а на Windows это неудобно. Production обязан задавать `NODE_ENV=production` явно.

## Что сделать

Роли, которые нужны первой прикладной задаче, — в этой ветке (`Р-2`). Остальные — отдельной задачей, когда понадобятся. Пути ролей — из `.claude/kit.json`.

| Роль | Путь | Правило | В этой ветке |
| --- | --- | --- | --- |
| `Clock` | `src/shared/clock` | `nestjs/roles.md` | да |
| `Ids` | `src/shared/ids` | `nestjs/roles.md` | да |
| `ConfigService` | `src/shared/configs` | `nestjs/config.md` | да |
| `EventLogger` | `src/shared/logging` | `nestjs/logging.md` | да |
| `ErrorResponse` | `src/shared/http` | `nestjs/errors.md` | да |
| `@Public()` | `src/shared/http` | `nestjs/api.md` | да |
| `DbService` | `src/shared/db` | `prisma-postgres/persistence.md` | да |
| `Transactions`, `Tx` | `src/shared/db` | `prisma-postgres/transactions.md` | да |
| `useTestApp` | `test/utils` | `nestjs/testing.md` | да |
| `createProbeApp` | `test/utils` | `nestjs/testing.md` | да |
| `responseBody` | `test/utils` | `nestjs/testing.md` | да |
| `cleanDatabase` | `test/utils` | `prisma-postgres/testing.md` | да |
| `ListQuery` | `src/shared/http` | `nestjs/api.md` | нет |
| `DevSeed` | `src/shared/seeding` | `nestjs/seeds.md` | нет |
| `isUniqueViolation` | `src/shared/db` | `prisma-postgres/persistence.md` | нет |
| `waitFor` | `test/utils` | `nestjs/testing.md` | нет |
| `defineFactory` | `test/factories` | `nestjs/testing.md` | нет |
| `runOverlapped`, `planOf`, `holdLock` | `test/utils` | `prisma-postgres/testing.md` | нет |

Кроме ролей:

1. `docker-compose.yml` — локальный PostgreSQL 17 с базами `kit_sandbox` и `kit_sandbox_e2e`.
2. Prisma 7 с адаптером `pg`: `prisma.config.ts`, `prisma/schema/schema.prisma`, клиент генерируется в `src/generated/prisma` и в git не попадает.
3. Сборка приложения в `src/app/`: модули ролей, префикс `/api/v1`, валидация, фильтр ошибок, документ API на `/api/docs`.
4. Стартовые `AppController`/`AppService` из шаблона Nest удаляются.

## Контракт

Контракт каждой роли описан в её правиле. Внешнего API у задачи нет; появляется общий формат ошибки `ErrorResponse` и заголовок `X-Request-Id`.

## Готово, когда

- [x] конфигурация отклоняет неверные и пустые значения — тест: `test/unit/configs/config.spec.ts`
- [x] журнал маскирует поля с секретными именами до восьми уровней — тест: `test/unit/logging/redact.spec.ts`
- [x] `Ids` выдаёт UUIDv7 — тест: `test/unit/ids/ids.spec.ts`
- [x] адрес базы получает `timezone=UTC` последним, свои `options` сохраняются — тест: `test/unit/db/session-options.spec.ts`
- [x] фильтр ошибок: строки таблицы, формат валидации, `requestId` в теле и заголовке; закрытый по умолчанию эндпоинт — тест: `test/e2e/http/errors.e2e-spec.ts`
- [x] журнал: одна запись `http.request` с шаблоном маршрута; `X-Request-Id` только UUID; 500 без текста — тест: `test/e2e/logging/request-log.e2e-spec.ts`
- [x] сессия базы в UTC; транзакция фиксирует и откатывает; предел запроса — тест: `test/e2e/db/db.e2e-spec.ts`
- [x] `npm run lint`, `npm run typecheck`, `npm test` и `npm run test:e2e` проходят
- [x] запись в `docs/` по `documentation.md`

## Не входит

- Роли с пометкой «нет» в таблице.
- Линт-проверки kit (`lint-roles`, `lint-boundaries` и др.): в kit они в статусе `planned`.
- Прикладные модули и модели предметной области.

## Итог

- Сделаны роли с пометкой «да»; остальные ждут задачи, которой они понадобятся.
- `setupApp` принимает реестр статусов ошибок параметром: e2e фильтра проверяет строку «доменная ошибка из реестра» на своём коде, а реестр приложения пока пуст.
- Стек в `http.unhandled_error` пишется без первой строки: в ней текст сообщения ошибки.
- Импорты переведены на расширение `.ts` (`allowImportingTsExtensions` + `rewriteRelativeImportExtensions` в `tsconfig.json`).
- Предложение про `NODE_ENV` по умолчанию `dev` ждёт подтверждения владельца.
- Проверок kit `openapi-contract`, `env-example`, `error-registry`, `lint-roles`, `lint-boundaries` в проекте пока нет: в kit они в статусе `planned`. Их требования соблюдены вручную.
