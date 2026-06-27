---
title: "Calendar"
description: "Grades mensais, navegação e seleção de datas com $calendar."
---

Package: `@ailuracode/alpinejs-calendar`

Lógica de calendário leve para Alpine.js, com [date-fns](https://date-fns.org/). Registra o magic chamável `$calendar` que retorna uma instância de calendário independente. O plugin **não** renderiza UI — você controla o markup e os estilos.

## Instalação

```bash
npm install @ailuracode/alpinejs-calendar alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import calendar from "@ailuracode/alpinejs-calendar";

Alpine.plugin(calendar);
Alpine.start();
```

Consumidores TypeScript podem adicionar:

```ts
/// <reference types="@ailuracode/alpinejs-calendar/global" />
```

## Magic API

Callable factory:

| Uso | Retorno | Descrição |
|-------|---------|-------------|
| `$calendar(options?)` | `CalendarInstance` | Cria uma instância independente de lógica de calendário |

Cada chamada retorna um novo objeto com seu próprio mês, seleção e dados de grade.

## Opções

| Opção | Tipo | Padrão | Descrição |
|--------|------|---------|-------------|
| `locale` | `Locale` | `enUS` | Locale date-fns para rótulos e formatação |
| `weekStartsOn` | `0`–`6` | `0` | Primeiro dia da semana (domingo = `0`) |
| `minDate` | `Date` | — | Data selecionável mais antiga |
| `maxDate` | `Date` | — | Data selecionável mais recente |
| `mode` | `"single"` \| `"range"` \| `"multiple"` | `"single"` | Comportamento de seleção |
| `month` | `Date` | mês atual | Mês visível inicial |
| `selected` | `Date` \| `Date[]` \| `{ from?, to? }` \| `null` | `null` | Seleção inicial |
| `disabled` | `CalendarMatcher` \| `CalendarMatcher[]` | — | Datas que não podem ser selecionadas |
| `dateFns` | `CalendarDateFnsOptions` | — | Contexto date-fns extra (locale, `in`, opções de semana, tokens de formato) |

## Desabilitando datas

Use `disabled` com um matcher ou um array. Se **qualquer** matcher corresponder, a data é desabilitada.

| Matcher | Descrição |
|---------|-------------|
| `true` | Desabilita todas as datas |
| `Date` | Desabilita um único dia |
| `Date[]` | Desabilita dias específicos |
| `{ from, to }` | Desabilita um intervalo **inclusivo** (extremidades incluídas) |
| `{ only: { from, to } }` | Desabilita tudo **fora** do intervalo inclusivo |
| `{ before: Date }` | Desabilita datas estritamente antes da data (exclusivo) |
| `{ after: Date }` | Desabilita datas estritamente depois da data (exclusivo) |
| `{ before, after }` | Desabilita datas estritamente entre os limites (extremidades exclusivas) |
| `{ dayOfWeek: Day \| Day[] }` | Desabilita dias da semana (`0` = domingo) |
| `(date) => boolean` | Predicado personalizado — retorne `true` para desabilitar |
| `CalendarMatcher[]` | Combine qualquer um dos acima |

```js
$calendar({
  minDate: new Date(2024, 0, 1),
  maxDate: new Date(2024, 11, 31),
  disabled: [
    { dayOfWeek: [0, 6] },
    { from: new Date(2024, 11, 24), to: new Date(2024, 11, 26) },
    new Date(2024, 6, 4),
    { only: { from: new Date(2024, 2, 1), to: new Date(2024, 2, 31) } },
    (date) => date.getMonth() === 7,
  ],
});
```

`minDate` / `maxDate` ainda se aplicam além de `disabled`.

## Contexto date-fns

Passe [opções date-fns](https://date-fns.org/) via `dateFns`. `locale` e `weekStartsOn` de nível superior são atalhos que se mesclam neste contexto.

Campos suportados incluem:

- `locale`
- `weekStartsOn`
- `firstWeekContainsDate`
- `useAdditionalWeekYearTokens`
- `useAdditionalDayOfYearTokens`
- `in` — função de contexto para extensões como [`TZDate`](https://github.com/date-fns/tz)

```js
import { tz } from "@date-fns/tz";

$calendar({
  locale: es,
  weekStartsOn: 1,
  dateFns: {
    in: tz("Europe/Madrid"),
  },
});
```

O contexto resolvido é exposto em cada instância como `cal.dateFns` e é passado para todas as chamadas internas date-fns.

## Instance API

### Estado

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `month` | `Date` | Mês visível (primeiro dia do mês) |
| `mode` | `CalendarMode` | Modo de seleção |
| `selected` | `Date` \| `Date[]` \| `{ from?, to? }` \| `null` | Seleção atual |
| `locale` | `Locale` | Locale ativo |
| `weekStartsOn` | `0`–`6` | Dia de início da semana |
| `dateFns` | `CalendarDateFnsOptions` | Contexto date-fns resolvido |
| `weeks` | `CalendarDay[][]` | Grade do mês para renderização |
| `weekdayLabels` | `string[]` | Cabeçalhos de dias da semana localizados |

### Navegação

| Método | Descrição |
|--------|-------------|
| `prevMonth()` | Vai para o mês anterior |
| `nextMonth()` | Vai para o próximo mês |
| `goToMonth(date)` | Salta para o mês que contém `date` |
| `goToToday()` | Salta para o mês atual |

### Seleção

| Método | Descrição |
|--------|-------------|
| `select(date)` | Seleciona ou alterna uma data (depende do modo) |
| `clear()` | Limpa a seleção atual |
| `matches(date, matcher)` | Verifica se uma data corresponde a um matcher |

### Consultas

| Método | Descrição |
|--------|-------------|
| `isSelected(date)` | Se a data está selecionada |
| `isDisabled(date)` | Se a data está fora de `minDate` / `maxDate` |
| `isToday(date)` | Se a data é hoje |
| `isSameMonth(date, month?)` | Se a data pertence a um mês |
| `isInRange(date)` | Dia intermediário do intervalo (modo range) |
| `isRangeStart(date)` | Extremidade inicial do intervalo |
| `isRangeEnd(date)` | Extremidade final do intervalo |

### Formatação

| Método | Descrição |
|--------|-------------|
| `format(date, pattern)` | Formata uma data com o locale ativo |
| `formatMonth(month?)` | Formata um rótulo de mês (`LLLL yyyy`) |
| `formatYear(month?)` | Formata um rótulo de ano |

## Exemplos HTML

### Seletor de data única

```html
<div x-data="{ cal: $calendar({ weekStartsOn: 1 }) }">
  <div class="calendar-header">
    <button type="button" @click="cal.prevMonth()">Previous</button>
    <strong x-text="cal.formatMonth()"></strong>
    <button type="button" @click="cal.nextMonth()">Next</button>
  </div>

  <div class="calendar-weekdays">
    <template x-for="label in cal.weekdayLabels" :key="label">
      <span x-text="label"></span>
    </template>
  </div>

  <template x-for="week in cal.weeks" :key="week[0].date.toISOString()">
    <div class="calendar-week">
      <template x-for="day in week" :key="day.date.toISOString()">
        <button
          type="button"
          :disabled="day.isDisabled"
          :class="{
            'is-outside': !day.isCurrentMonth,
            'is-today': day.isToday,
            'is-selected': day.isSelected
          }"
          @click="cal.select(day.date)"
          x-text="cal.format(day.date, 'd')"
        ></button>
      </template>
    </div>
  </template>

  <p x-show="cal.selected">
    Selected:
    <strong x-text="cal.format(cal.selected, 'PPP')"></strong>
  </p>
</div>
```

### Seletor de intervalo com limites

```html
<div
  x-data="{
    cal: $calendar({
      mode: 'range',
      weekStartsOn: 1,
      minDate: new Date(2024, 0, 1),
      maxDate: new Date(2024, 11, 31)
    })
  }"
>
  <!-- same grid markup as above, plus range classes -->
  <template x-for="week in cal.weeks" :key="week[0].date.toISOString()">
    <div class="calendar-week">
      <template x-for="day in week" :key="day.date.toISOString()">
        <button
          type="button"
          :disabled="day.isDisabled"
          :class="{
            'is-range-start': day.isRangeStart,
            'is-range-end': day.isRangeEnd,
            'is-in-range': day.isInRange
          }"
          @click="cal.select(day.date)"
          x-text="cal.format(day.date, 'd')"
        ></button>
      </template>
    </div>
  </template>
</div>
```

### Locale espanhol

```js
import { es } from "date-fns/locale";

Alpine.data("bookingCalendar", () => ({
  cal: null,
  init() {
    this.cal = this.$calendar({ locale: es, weekStartsOn: 1 });
  },
}));
```

## Tree-shaking

Importe helpers diretamente quando não precisar do plugin Alpine:

```js
import { createCalendar } from "@ailuracode/alpinejs-calendar";

const cal = createCalendar({ weekStartsOn: 1 });
```

## SSR

O plugin não toca em `window` ou `navigator` durante a inicialização. Instâncias de calendário usam apenas `Date` e date-fns, portanto são seguras para criar durante SSR desde que você evite renderizar UI exclusiva do navegador ao redor delas.
