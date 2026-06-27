---
title: "Calendar"
description: "Cuadrículas de mes, navegación y selección de fechas con $calendar."
---

Package: `@ailuracode/alpinejs-calendar`

Lógica de calendario ligera para Alpine.js, impulsada por [date-fns](https://date-fns.org/). Registra el magic invocable `$calendar` que devuelve una instancia de calendario independiente. El plugin **no** renderiza UI — tú controlas el markup y los estilos.

## Instalación

```bash
npm install @ailuracode/alpinejs-calendar alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import calendar from "@ailuracode/alpinejs-calendar";

Alpine.plugin(calendar);
Alpine.start();
```

Los consumidores de TypeScript pueden añadir:

```ts
/// <reference types="@ailuracode/alpinejs-calendar/global" />
```

## Magic API

Callable factory:

| Uso | Devuelve | Descripción |
|-------|---------|-------------|
| `$calendar(options?)` | `CalendarInstance` | Crea una instancia independiente de lógica de calendario |

Cada llamada devuelve un nuevo objeto con su propio mes, selección y datos de cuadrícula.

## Opciones

| Opción | Tipo | Predeterminado | Descripción |
|--------|------|---------|-------------|
| `locale` | `Locale` | `enUS` | Locale de date-fns para etiquetas y formato |
| `weekStartsOn` | `0`–`6` | `0` | Primer día de la semana (domingo = `0`) |
| `minDate` | `Date` | — | Fecha seleccionable más temprana |
| `maxDate` | `Date` | — | Fecha seleccionable más tardía |
| `mode` | `"single"` \| `"range"` \| `"multiple"` | `"single"` | Comportamiento de selección |
| `month` | `Date` | mes actual | Mes visible inicial |
| `selected` | `Date` \| `Date[]` \| `{ from?, to? }` \| `null` | `null` | Selección inicial |
| `disabled` | `CalendarMatcher` \| `CalendarMatcher[]` | — | Fechas que no se pueden seleccionar |
| `dateFns` | `CalendarDateFnsOptions` | — | Contexto adicional de date-fns (locale, `in`, opciones de semana, tokens de formato) |

## Deshabilitar fechas

Usa `disabled` con un matcher o un array. Si **cualquier** matcher coincide, la fecha queda deshabilitada.

| Matcher | Descripción |
|---------|-------------|
| `true` | Deshabilita todas las fechas |
| `Date` | Deshabilita un día concreto |
| `Date[]` | Deshabilita días específicos |
| `{ from, to }` | Deshabilita un rango **inclusivo** (incluye los extremos) |
| `{ only: { from, to } }` | Deshabilita todo **fuera** del rango inclusivo |
| `{ before: Date }` | Deshabilita fechas estrictamente anteriores a la fecha (exclusivo) |
| `{ after: Date }` | Deshabilita fechas estrictamente posteriores a la fecha (exclusivo) |
| `{ before, after }` | Deshabilita fechas estrictamente entre los límites (extremos exclusivos) |
| `{ dayOfWeek: Day \| Day[] }` | Deshabilita días de la semana (`0` = domingo) |
| `(date) => boolean` | Predicado personalizado — devuelve `true` para deshabilitar |
| `CalendarMatcher[]` | Combina cualquiera de los anteriores |

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

`minDate` / `maxDate` se aplican además de `disabled`.

## Contexto date-fns

Pasa [opciones de date-fns](https://date-fns.org/) mediante `dateFns`. Los atajos de nivel superior `locale` y `weekStartsOn` se fusionan en este contexto.

Los campos soportados incluyen:

- `locale`
- `weekStartsOn`
- `firstWeekContainsDate`
- `useAdditionalWeekYearTokens`
- `useAdditionalDayOfYearTokens`
- `in` — función de contexto para extensiones como [`TZDate`](https://github.com/date-fns/tz)

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

El contexto resuelto se expone en cada instancia como `cal.dateFns` y se pasa a cada llamada interna de date-fns.

## Instance API

### Estado

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `month` | `Date` | Mes visible (primer día del mes) |
| `mode` | `CalendarMode` | Modo de selección |
| `selected` | `Date` \| `Date[]` \| `{ from?, to? }` \| `null` | Selección actual |
| `locale` | `Locale` | Locale activo |
| `weekStartsOn` | `0`–`6` | Día de inicio de semana |
| `dateFns` | `CalendarDateFnsOptions` | Contexto date-fns resuelto |
| `weeks` | `CalendarDay[][]` | Cuadrícula del mes para renderizar |
| `weekdayLabels` | `string[]` | Encabezados de días de la semana localizados |

### Navegación

| Método | Descripción |
|--------|-------------|
| `prevMonth()` | Ir al mes anterior |
| `nextMonth()` | Ir al mes siguiente |
| `goToMonth(date)` | Saltar al mes que contiene `date` |
| `goToToday()` | Saltar al mes actual |

### Selección

| Método | Descripción |
|--------|-------------|
| `select(date)` | Seleccionar o alternar una fecha (según el modo) |
| `clear()` | Limpiar la selección actual |
| `matches(date, matcher)` | Comprobar si una fecha coincide con un matcher |

### Consultas

| Método | Descripción |
|--------|-------------|
| `isSelected(date)` | Si la fecha está seleccionada |
| `isDisabled(date)` | Si la fecha está fuera de `minDate` / `maxDate` |
| `isToday(date)` | Si la fecha es hoy |
| `isSameMonth(date, month?)` | Si la fecha pertenece a un mes |
| `isInRange(date)` | Día intermedio del rango (modo range) |
| `isRangeStart(date)` | Extremo inicial del rango |
| `isRangeEnd(date)` | Extremo final del rango |

### Formato

| Método | Descripción |
|--------|-------------|
| `format(date, pattern)` | Formatear una fecha con el locale activo |
| `formatMonth(month?)` | Formatear etiqueta de mes (`LLLL yyyy`) |
| `formatYear(month?)` | Formatear etiqueta de año |

## Ejemplos HTML

### Selector de fecha única

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

### Selector de rango con límites

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

### Locale español

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

Importa helpers directamente cuando no necesites el plugin Alpine:

```js
import { createCalendar } from "@ailuracode/alpinejs-calendar";

const cal = createCalendar({ weekStartsOn: 1 });
```

## SSR

El plugin no toca `window` ni `navigator` durante la inicialización. Las instancias de calendario solo usan `Date` y date-fns, por lo que son seguras de crear durante SSR siempre que evites renderizar UI exclusiva del navegador alrededor de ellas.
