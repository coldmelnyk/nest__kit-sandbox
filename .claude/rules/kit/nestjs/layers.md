---
paths:
    - 'src/*/*/domain/**'
    - 'src/*/*/ports/**'
    - 'src/*/*/application/**'
    - 'src/*/*/infrastructure/**'
    - 'src/*/*/presentation/**'
    - 'src/*/*/*.module.ts'
---

# Слои модуля

## Раскладка

```
src/core/<модуль>/ или src/modules/<модуль>/
  index.ts                       что модуль открывает другим
  <модуль>.module.ts             связь портов с реализациями
  domain/                        правила предметной области
    <модуль>.errors.ts
    entities/<предмет>.entity.ts
    rules/<правило>.ts
  ports/                         абстрактные классы: всё, что модулю нужно снаружи
    <предмет>.repository.ts
    <что>.port.ts
  application/                   сценарии
    <модуль>.log-events.ts
    services/<тема>.service.ts
    seeds/<что>.seed.ts
  infrastructure/                реализации портов
    <модель>.select.ts
    <технология>/<что>.ts
  presentation/                  HTTP
    <тема>.controller.ts
    <модуль>.error-statuses.ts
    dto/  mappers/  guard/  decorators/
```

Слой, который модулю не нужен, не заводится.

## Кто кого импортирует

| Слой | Можно | Нельзя |
| --- | --- | --- |
| `domain/` | только `domain/` своего модуля | всё остальное: другие слои и модули, `shared/`, `generated/`, Nest, ORM |
| `ports/` | `domain/`, `shared/`, `index.ts` модулей ядра | другие слои, `generated/`, Nest, ORM |
| `application/` | `domain/`, `ports/`, выборки `infrastructure/*.select.ts`, `shared/`, `index.ts` ядра | остальной `infrastructure/`, `presentation/` |
| `infrastructure/` | `domain/`, `ports/`, `shared/`, `generated/`, `index.ts` ядра | `application/`, `presentation/` |
| `presentation/` | `application/`, `domain/`, выборки `infrastructure/*.select.ts`, `shared/`, `index.ts` ядра | `ports/`, остальной `infrastructure/` |

## Следствия

- **Правила предметной области — в `domain/`.** Проверка состояния сущности в сервисе или контроллере означает, что правило ушло из entity.
- **Время и id entity получает параметрами.** Сама entity не читает часы и не создаёт id: их берёт сервис из `Clock` и `Ids` (`roles.md`).
- **Доменная ошибка ничего не знает об HTTP.** Статус назначает таблица в `presentation/` (`errors.md`).
- **Enum чужого модуля не импортируется, а повторяется** в своём `domain/`. В `infrastructure/` копию связывают с оригиналом проверочной строкой типов, чтобы расхождение ломало компиляцию.
- **`application/` не видит DTO.** Сервис принимает свои типы входа и отдаёт доменное представление или тип выборки. DTO — забота контроллера.
- **Контроллер тонкий:** разобрать запрос, вызвать один метод сервиса, вернуть DTO.
- **Внешнее — через порт** (`ports.md`).

```ts
export class InvoiceEntity {
    private constructor(private state: InvoiceState) {}

    static issue(input: { id: string; customerId: string; amountCents: number; now: Date }): InvoiceEntity {
        return new InvoiceEntity({ ...input, issuedAt: input.now, voidedAt: null });
    }

    void(now: Date): void {
        if (this.state.voidedAt !== null) {
            throw new InvoicesError('INVOICES_ALREADY_VOIDED', 'Invoice is already voided');
        }
        this.state = { ...this.state, voidedAt: now };
    }
}

const invoice = InvoiceEntity.issue({
    id: this._ids.next(),
    customerId,
    amountCents,
    now: this._clock.now(),
});
```

## Когда заводить entity и репозиторий

Только если у сущности есть переходы состояний, правила, общие для всех операций, или необратимые последствия. Иначе сервис работает с базой через выборки.
Чтение для экранов и списков всегда идёт выборками, мимо репозитория — даже в модуле, где entity есть.

## Сервисы

Сервис отвечает за тему, а не за весь модуль: `services/invoice-issuing.service.ts`, `services/invoice-export.service.ts`. Если в сервисе сошлись две темы, его делят.

## Папки внутри слоя

- Файлы раскладываются по папкам вида. Папка заводится вместе с первым файлом.
- `domain/` — `entities/`, `rules/`. Тип, собранный из нескольких entity, — отдельный файл в `entities/`.
- `application/` — `services/`, `seeds/`.
- `presentation/` — `dto/`, `mappers/`, `guard/`, `decorators/`.
- `infrastructure/` — по технологиям: `prisma/`, `node/`, `smtp/`. Единственное исключение — `dev/`: заглушки для окружения `dev` (`ports.md`).
- В корне слоя — только то, у чего нет вида: ошибки модуля, события журнала, таблица статусов, контроллеры, выборки.
- Вложенность — не больше одной папки.

## Проверяется автоматически

- `lint-boundaries`: направления из таблицы на двух уровнях вложенности; `domain/` и `ports/` без Nest и ORM.

## Не проверяется

- Правило, ушедшее из entity в сервис; entity, которая сама читает время или создаёт id.
- Entity для простой сущности; чтение для экрана через репозиторий.
- Сервис на несколько тем; вложенность глубже одной папки; файл не в папке своего вида.
