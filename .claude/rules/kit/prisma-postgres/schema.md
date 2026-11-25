---
paths:
    - 'prisma/schema/**'
---

# Схема базы

## Имена

| Что | В схеме Prisma | В базе |
| --- | --- | --- |
| Модель | `Invoice` — единственное число | `invoices` — `@@map`, множественное |
| Поле | `issuedAt` — camelCase | `issued_at` — `@map` |
| Enum | `InvoiceState` | `invoice_state` — `@@map` |
| Значение enum | `in_review` — snake_case в нижнем регистре | то же |
| Ключ связи | `<сущность>Id`: `customerId` | `customer_id` |
| Момент времени | оканчивается на `At`: `voidedAt` | `voided_at` |
| Логическое | `is…` или `has…` | `is_paid` |

У каждой модели `@@map`, у каждого поля из нескольких слов `@map`. Сырой SQL пишется без кавычек вокруг имён.

## Схемы PostgreSQL

- У каждого модуля своя схема PostgreSQL с именем файла `prisma/schema/<модуль>.prisma`.
- У каждой модели и enum `@@schema("<модуль>")` — последней строкой, после `@@map`.
- Новая схема вносится в список `schemas` в общем файле схемы.
- В `public` моделей нет.
- В сыром SQL таблица и тип называются со схемой: `billing.invoices`, `billing.invoice_state`.

## Типы

- **Id** — `String @id @db.Uuid` без `@default`: значение приходит из `Ids` или из запроса клиента.
- **Время** — `DateTime @db.Timestamptz(3)`, без `@default(now())` и `@updatedAt`: время приходит из `Clock`.
- **Деньги** — целое число в минимальных единицах, единица — в имени: `amountCents Int`. `Float` не используется.
- **Набор значений** — `enum`, а не строка и не пара логических полей. Исключение — значение, которое объявляют разные модули в общей таблице: оно хранится строкой `<модуль>.<имя>`, иначе каждое новое значение требовало бы миграции чужого модуля.
- **`Json`** — только для данных, которые база не фильтрует и не соединяет.

## «Значения нет»

- Поле необязательное (`?`), только когда отсутствие значения — настоящее состояние: `voidedAt DateTime?`.
- Пустая строка вместо `null` не хранится. Логическое поле необязательным не бывает.

## Связи

- Внешний ключ — внутри модуля или в сторону ядра (`persistence.md`, «Владение таблицами»).
- `onDelete` указан всегда. `Cascade` — только для частей одной entity, которые без неё не живут. В остальных случаях `Restrict`.
- У каждой колонки внешнего ключа есть индекс, где она стоит первой.

## Индексы и ограничения

- Список — индекс по полям фильтра и сортировки: `@@index([customerId, createdAt, id])`.
- Уникальность — `@@unique`.
- Частичный уникальный индекс, ограничение-исключение и триггер Prisma описать не умеет. Они пишутся руками в SQL миграции, а над моделью — строка с их именами. Колонки такого индекса в `@@unique` и `@@index` не повторяются: условия Prisma не видит и предложит переименовать индекс.

## Порядок в модели

Id, ключи связей, данные, время; пустая строка; связи; пустая строка; `@@index`, `@@unique`, `@@map`, `@@schema`.

```prisma
enum InvoiceState {
  draft
  issued
  void

  @@map("invoice_state")
  @@schema("billing")
}

model Invoice {
  id          String       @id @db.Uuid
  customerId  String       @map("customer_id") @db.Uuid
  state       InvoiceState
  amountCents Int          @map("amount_cents")
  createdAt   DateTime     @map("created_at") @db.Timestamptz(3)
  voidedAt    DateTime?    @map("voided_at") @db.Timestamptz(3)

  customer Customer      @relation(fields: [customerId], references: [id], onDelete: Restrict)
  lines    InvoiceLine[]

  @@index([customerId, createdAt, id])
  @@map("invoices")
  @@schema("billing")
}
```

## Проверяется автоматически

- `schema-conventions`: `@@map` в snake_case у модели и enum, `@map` у полей из нескольких слов; `@@schema` по имени файла; значения enum в snake_case; id — `@db.Uuid` без `@default`; `DateTime` — `@db.Timestamptz`, без `@default(now())` и `@updatedAt`; нет `Float`; у связи есть `onDelete`, колонка внешнего ключа первая в каком-то индексе.
- `tsc`: создание записи без id или времени не компилируется.
- `schema-migrations-sync`: схема совпадает с миграциями.
- `table-ownership`: модель используется только своим модулем.

## Не проверяется

- Множественное число в имени таблицы; имена полей (`…At`, `is…`, `<сущность>Id`).
- Необязательное поле без причины; `Json` для фильтруемых данных.
- `Cascade` вместо `Restrict`.
- Ограничения, написанные в SQL миграции, и строка с их именами над моделью.
- Имя схемы в сыром SQL.
