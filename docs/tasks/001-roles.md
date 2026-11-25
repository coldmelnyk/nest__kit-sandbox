# 001. Реализовать роли kit

- **Когда:** 2026-11-25
- **Ветка:** `feature/shared-roles`
- **Источник:** правила `.claude/rules/kit/` после установки claude-kit (`Д-1`)
- **Оценка:** не оценено
- **Внешние зависимости:** согласие владельца на каждую новую runtime-зависимость (`base/dependencies.md`); для ролей базы — Prisma и PostgreSQL, их в проекте пока нет

## Зачем

Правила уже требуют получать время, id, конфигурацию, журнал, доступ к базе и тестовую оснастку только через роли. Пока реализаций нет, новому коду не на что опереться.

## Предложено (подтвердить)

- Разделить задачу на несколько, каждая в своей ветке: роли без базы; роли базы вместе с подключением Prisma; тестовая оснастка.
- Библиотеки для UUIDv7, проверки конфигурации и журнала выбираются и согласуются до кода.

## Что сделать

Реализовать роли по их правилам. Имена и пути — из `.claude/kit.json`, поле `packages[].roles`. Пути правил даны от `.claude/rules/kit/`.

| Роль | Путь | Правило |
| --- | --- | --- |
| `Clock` | `src/shared/clock` | `nestjs/roles.md` |
| `Ids` | `src/shared/ids` | `nestjs/roles.md` |
| `ConfigService` | `src/shared/configs` | `nestjs/config.md` |
| `EventLogger` | `src/shared/logging` | `nestjs/logging.md` |
| `ErrorResponse` | `src/shared/http` | `nestjs/errors.md` |
| `@Public()` | `src/shared/http` | `nestjs/api.md` |
| `ListQuery` | `src/shared/http` | `nestjs/api.md` |
| `DevSeed` | `src/shared/seeding` | `nestjs/seeds.md` |
| `DbService` | `src/shared/db` | `prisma-postgres/persistence.md` |
| `isUniqueViolation` | `src/shared/db` | `prisma-postgres/persistence.md` |
| `Transactions` | `src/shared/db` | `prisma-postgres/transactions.md` |
| `Tx` | `src/shared/db` | `prisma-postgres/transactions.md` |
| `useTestApp` | `test/utils` | `nestjs/testing.md` |
| `createProbeApp` | `test/utils` | `nestjs/testing.md` |
| `responseBody` | `test/utils` | `nestjs/testing.md` |
| `waitFor` | `test/utils` | `nestjs/testing.md` |
| `defineFactory` | `test/factories` | `nestjs/testing.md` |
| `cleanDatabase` | `test/utils` | `prisma-postgres/testing.md` |
| `runOverlapped` | `test/utils` | `prisma-postgres/testing.md` |
| `planOf` | `test/utils` | `prisma-postgres/testing.md` |
| `holdLock` | `test/utils` | `prisma-postgres/testing.md` |

## Контракт

Контракт каждой роли описан в её правиле. Внешнего API у задачи нет.

## Готово, когда

- [ ] каждая роль из таблицы лежит по своему пути и выполняет контракт правила — тест: называется при реализации
- [ ] `Clock` и `Ids` подменяются в тестах двойниками — тест: называется при реализации
- [ ] `npm run lint`, `npm run typecheck`, `npm test` и `npm run test:e2e` проходят
- [ ] запись в `docs/` по `documentation.md`

## Не входит

- Линт-проверка обходов ролей (`lint-roles`): в kit она в статусе `planned`.
- Прикладные модули и модели предметной области.

## Итог

Заполняется в конце.
