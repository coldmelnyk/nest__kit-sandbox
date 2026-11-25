# 002. Хранить и отдавать контент главной страницы

- **Когда:** 2026-11-25
- **Ветка:** `feature/homepage-content` (от `feature/shared-roles`: модуль опирается на роли из задачи 001; PR в `dev` — после слияния ролей)
- **Источник:** макет главной в Figma (файл «Microwar», кадр `homepage`), ответы владельца 2026-11-25 (`Р-3`)
- **Оценка:** 1 день
- **Внешние зависимости:** задача 001 (роли kit)

## Зачем

Тексты и картинки главной сейчас живут только в макете. Фронтенду нужен API, из которого он берёт контент главной на нужном языке, и способ этот контент менять без выпуска.

## Предложено (подтвердить)

- Модуль называется `homepage`, а не `home-page`: имя модуля становится именем схемы PostgreSQL, а дефис в нём требует кавычек в сыром SQL.
- `locale` в обоих методах — обязательный query-параметр, без значения по умолчанию: язык страницы выбирает клиент.
- `PATCH` заменяет целиком каждую переданную секцию; непереданные секции не меняются. Пустое тело допустимо и только обновляет `updatedAt`.
- Заголовки с акцентным цветом хранятся двумя полями — `title` и `titleAccent`; где стоит акцент, решает фронтенд.
- Шапка и футер (навигация, соцсети, подписка на рассылку) не входят в контент главной: они общие для всех страниц.

## Что сделать

1. Прикладной модуль `src/modules/homepage/`: домен (локали, секции, тип контента, ошибки), порт записи, реализация на Prisma, сервис, контроллер, DTO, маппер.
2. Схема `prisma/schema/homepage.prisma`, схема PostgreSQL `homepage`, таблица `homepage_contents`: строка на локаль, контент — `jsonb` объект с секциями.
3. Миграция `add_homepage_content` создаёт таблицу и по строке на `en` и `uk` с пустым контентом: строковые поля `null`, списки пустые.
4. `cleanDatabase` возвращает базу к состоянию сразу после миграций, а не к пустым таблицам: иначе тесты теряют строки, которые создаёт миграция.

Секции (по макету):

| Ключ | Что в макете | Поля |
| --- | --- | --- |
| `hero` | первый экран | `title`, `subtitle`, `backgroundImageUrl` |
| `products` | карточки Rangermobile и Beezooka | `items[]`: `name`, `tagline`, `imageUrl`, `linkUrl` |
| `combatProof` | «Proven in combat. Not in a lab.» с видео | `titleAccent`, `title`, `text`, `buttonLabel`, `buttonUrl`, `videoUrl`, `posterImageUrl` |
| `features` | восемь преимуществ с иконками | `items[]`: `icon`, `label` |
| `about` | «About Microwar» | `title`, `titleAccent`, `paragraphs[]` |

## Контракт

Оба эндпоинта открыты (`@Public()`) до появления авторизации (`Р-3`).

`GET /api/v1/pages/home?locale=en|uk` → 200 `HomePage-Page`:

```json
{
  "locale": "en",
  "hero": { "title": null, "subtitle": null, "backgroundImageUrl": null },
  "products": { "items": [] },
  "combatProof": { "titleAccent": null, "title": null, "text": null, "buttonLabel": null, "buttonUrl": null, "videoUrl": null, "posterImageUrl": null },
  "features": { "items": [] },
  "about": { "title": null, "titleAccent": null, "paragraphs": [] },
  "updatedAt": null
}
```

`PATCH /api/v1/pages/home?locale=en|uk`, тело `HomePage-UpdateRequest` — любые из секций целиком → 200 `HomePage-Page`, обновлённая страница.

Ошибки: 400 `VALIDATION_FAILED` — неверная или отсутствующая `locale`, неверное поле секции, лишняя длина. Строки контента для отсутствующей локали быть не может (её создаёт миграция) — это сбой, 500 `INTERNAL_ERROR`.

## Готово, когда

- [x] после миграций для `en` и `uk` есть пустая страница — тест: `test/e2e/homepage/homepage.e2e-spec.ts` › `returns the empty page the migration created`
- [x] `PATCH` заменяет переданные секции, не трогает остальные, ставит `updatedAt` из `Clock` и возвращает страницу — тест: `… › updates only the sections sent`
- [x] локали независимы — тест: `… › keeps locales apart`
- [x] неверная локаль и неверное тело — 400 `VALIDATION_FAILED` с путём поля — тест: `… › rejects …`
- [x] изменение пишет событие `homepage.content_updated` без текста контента — тест: `… › logs the update without content`
- [x] `npm run lint`, `npm run typecheck`, `npm test` и `npm run test:e2e` проходят
- [x] запись в `docs/` по `documentation.md`

## Не входит

- Авторизация и закрытие `PATCH`.
- Загрузка картинок и видео: в контенте только их адреса.
- Шапка, футер, подписка на рассылку.
- Сиды с демо-контентом.

## Итог

- Сделано по плану: модуль `homepage`, миграция `add_homepage_content` с пустыми страницами `en` и `uk`, `GET` и `PATCH /api/v1/pages/home`.
- Entity и репозитория нет: между чтением и записью ничего не решается. Запись — порт хранилища без entity (`HomepageContentRepository.replaceSections`), один оператор `content || patch`.
- Типы контента лежат в `domain/homepage-content.ts`, в корне слоя: это не entity и не правило, а у `layers.md` нет для них папки.
- Не по плану: e2e больше не пишет в базу из `DATABASE_URL`. Каждый прогон создаёт свою базу `<имя>_run_<pid>`, применяет миграции и удаляет её в конце (`test/setup/migrate.ts`). Причина: `cleanDatabase` должна возвращать строки, которые вставляет миграция, а снимок можно снять только со свежей мигрированной базы. Записано в `docs/architecture.md`, «Тесты с базой».
- Список модулей kit ведёт в `kit/nestjs/modules.md`, который не правится; модуль внесён в `.claude/rules/project/modules.md`.
- Таблицы статусов ошибок у модуля нет: отказов клиенту нет, единственный код `HOMEPAGE_CONTENT_MISSING` — сбой.
- Пункты «Предложено» ждут подтверждения владельца.
