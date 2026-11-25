---
paths:
    - 'src/*/*/ports/**'
    - 'src/*/*/infrastructure/**'
    - 'src/*/*/*.module.ts'
    - 'src/*/*/application/services/**'
    - 'src/app/app-ports.module.ts'
---

# Порты

Порт — абстрактный класс, через который модуль обращается наружу: к базе, внешнему сервису, другому модулю ядра. Сценарий зависит от порта, а не от того, что за ним.

## Где лежат

- `ports/` — только абстрактные классы и типы их сигнатур.
- `infrastructure/` — реализации.
- В `domain/` абстрактных классов для DI нет: там entity, правила и ошибки.

## Виды портов

| Вид | Для чего | Файл порта | Реализация | Где связан |
| --- | --- | --- | --- | --- |
| Хранилище | загрузить и сохранить entity | `ports/<предмет>.repository.ts` | `infrastructure/<ORM>/` | `<модуль>.module.ts` |
| Внешний | то, что вне процесса или зависит от окружения: SMS, хэширование, случайность | `ports/<что>.port.ts` | `infrastructure/<технология>/` | `<модуль>.module.ts` |
| Запросы чтения | чтение, которое не выразить выборкой | `ports/<что>-queries.port.ts` | `infrastructure/<ORM>/` | `<модуль>.module.ts` |
| Модуль ядра | модулю нужно ядро, а связь хочется держать за портом | `ports/` потребителя | `infrastructure/<модуль ядра>/` | `<модуль>.module.ts` |
| Обратная зависимость | двум модулям ядра нужны друг друга | `ports/` потребителя | `infrastructure/` поставщика | `app/app-ports.module.ts` |

Роли общего назначения — время и id — лежат в `shared/`, а не в модуле (`roles.md`).

## Каким должен быть порт

- В файле один абстрактный класс и типы его сигнатур. Ни реализаций, ни констант, ни логики.
- Метод назван по тому, что нужно сценарию, а не по технологии: `send(phone, text)`, а не `callGatewayApi`.
- Порт импортирует только `domain/` своего модуля, `shared/` и `index.ts` ядра — ради типов сигнатур. Nest, ORM и `generated/` в нём нет.
- У хранилища транзакция — первый параметр каждого метода.
- Класс назван по роли: `InvoiceRepository`, `PasswordHasher`, `SmsSender`.

```ts
export abstract class InvoiceRepository {
    abstract lockById(tx: Tx, invoiceId: string): Promise<InvoiceEntity>;
    abstract save(tx: Tx, invoice: InvoiceEntity): Promise<void>;
}
```

## Реализация

- Имя — технология и роль: `PrismaInvoiceRepository`, `ArgonPasswordHasher`.
- О библиотеке или провайдере знает только реализация. Смена технологии — замена одного файла и одной строки в модуле.
- Связь — в файле модуля: `{ provide: InvoiceRepository, useClass: PrismaInvoiceRepository }`.
- Если реализация зависит от окружения, её выбирает фабрика в файле модуля по конфигурации. Само правило выбора — функция в `domain/rules/` с unit-тестом.
- Заглушка для окружения `dev` лежит в `infrastructure/dev/`.

## Обратная зависимость

`src/app/app-ports.module.ts` содержит только строки `{ provide: Порт, useExisting: Реализация }`. Логики и функций там нет. `forwardRef` не используется.

## В тестах

Двойник реализует порт и лежит в `test/utils/<что>.double.ts`. Подмена — через переопределение провайдера в `useTestApp` (`testing.md`).

## Проверяется автоматически

- `lint-boundaries`: `ports/` импортирует только `domain/`, `shared/` и `index.ts` ядра, без Nest, ORM и `generated/`; `infrastructure/` не импортирует `application/`; `presentation/` и `domain/` не импортируют `ports/`.
- Nest при старте падает, если у порта нет реализации.

## Не проверяется

- Абстрактный класс для DI в `domain/`; логика или реализация в файле порта.
- Логика в `app-ports.module.ts`.
- Имя метода, выдающее технологию.
