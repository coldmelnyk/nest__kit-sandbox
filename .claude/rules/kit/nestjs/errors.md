---
paths:
    - 'src/**/*.errors.ts'
    - 'src/**/*.error-statuses.ts'
    - 'src/app/error-statuses.ts'
    - 'src/shared/http/**'
---

# Ошибки

## Тело ответа с ошибкой

У любой ошибки — одно тело `ErrorResponse`:

```json
{
    "code": "INVOICES_ALREADY_VOIDED",
    "message": "Invoice is already voided",
    "details": { "invoiceId": "0193a4b2-5c6d-7e8f-9a0b-1c2d3e4f5a6b" },
    "requestId": "2f4e6a8c-1b3d-4f5a-8c7e-9d0b1a2c3e4f"
}
```

- `code` — UPPER_SNAKE_CASE с префиксом модуля. Текст для пользователя клиент выбирает по коду.
- `message` — короткий английский текст для разработчиков. Пользователю его не показывают.
- `details` — необязательные структурированные данные. Секретов и чужих данных в них нет.
- `requestId` — тот же id, что в заголовке `X-Request-Id` и в журнале.
- HTTP-статус сохраняет смысл: 400, 401, 403, 404, 409, 429, 500.

## Доменная ошибка

- `domain/<модуль>.errors.ts` — тип кодов и класс ошибки с `code`, `message`, `details`. Без HTTP и без общего базового класса: `domain/` ничего не импортирует.
- Коды делятся на два типа: **отказы клиенту** (нельзя аннулировать оплаченный счёт) и **сбои** (нарушено правило вызова, модуль отклонил собственную запись).
- `presentation/<модуль>.error-statuses.ts` — таблица «код → статус» только для отказов клиенту. Суффикс имени файла обязателен: по нему таблицу находит проверка реестра.
- Сбой в таблицу не вносится. Он уходит клиенту как 500 `INTERNAL_ERROR` без подробностей и попадает в журнал. Сбой со статусом в таблице отдал бы клиенту `details` и не попал бы в журнал.
- Таблица модуля добавляется в общий реестр `src/app/error-statuses.ts`. Код, которого нет в реестре, уходит как 500.
- У модуля без HTTP таблица заводится, как только его ошибка может дойти до клиента через чей-то эндпоинт.
- `domain/`, `application/` и `infrastructure/` бросают только доменные ошибки. HTTP-исключения фреймворка — только в `presentation/`.

```ts
export type InvoicesRejection = 'INVOICES_ALREADY_VOIDED' | 'INVOICES_NOT_FOUND';
export type InvoicesFault = 'INVOICES_AMOUNT_MISMATCH';

export class InvoicesError extends Error {
    constructor(
        readonly code: InvoicesRejection | InvoicesFault,
        message: string,
        readonly details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'InvoicesError';
    }
}

export const INVOICES_ERROR_STATUSES = {
    INVOICES_ALREADY_VOIDED: 409,
    INVOICES_NOT_FOUND: 404,
} satisfies Record<InvoicesRejection, number>;
```

## Фильтр ошибок

Фильтр один на приложение, модули своих не заводят.

| Что пришло | Статус | `code` |
| --- | --- | --- |
| Доменная ошибка с кодом из реестра | из реестра | код ошибки |
| HTTP-исключение с телом `{ code, … }` | статус исключения | код из тела |
| Другое HTTP-исключение | статус исключения | имя статуса: `NOT_FOUND` |
| Ошибка разбора тела запроса (4xx) | этот статус | имя статуса: `PAYLOAD_TOO_LARGE` |
| Всё остальное | 500 | `INTERNAL_ERROR`, подробности — только в журнал |

## Частные случаи

- **Ошибка валидации** — 400 `VALIDATION_FAILED`. В `details.fields` — путь к полю и нарушенные правила: `{ "path": "billing.email", "rules": ["isEmail"] }`.
- **Превышен лимит** — 429 с `details.retryAfterSeconds`. Фильтр сам ставит заголовок `Retry-After`. Клиент берёт время из тела: страница с другого адреса этот заголовок не видит.

## Проверяется автоматически

- `tsc`: таблица модуля типизирована отказами клиенту и содержит их все; код сбоя в неё не внести.
- `error-registry`: каждая таблица `*.error-statuses.ts` есть в реестре с тем же статусом; в реестре нет статусов от 500.
- `lint-boundaries`: `application/` и `infrastructure/` не импортируют HTTP-исключения; `domain/` не импортирует Nest.
- e2e фильтра: каждая строка таблицы «Фильтр ошибок», формат ошибки валидации, `Retry-After` у 429, `requestId` в теле и заголовке.

## Не проверяется

- Имена кодов и префикс модуля.
- Секреты и чужие данные в `details`.
- Что код правильно отнесён к отказам или сбоям.
