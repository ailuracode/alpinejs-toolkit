# @ailuracode/alpine-calendar

Lightweight calendar date logic for Alpine.js, powered by [date-fns](https://date-fns.org/).

**[Full documentation →](../../docs/plugins/calendar.md)**

## Install

```bash
pnpm add @ailuracode/alpine-calendar @ailuracode/alpine-selection alpinejs
```

Date selection uses `@ailuracode/alpine-selection` internally (ISO date keys, single/multiple/range modes).

## Quick example

```ts
import Alpine from "alpinejs";
import calendar from "@ailuracode/alpine-calendar";

Alpine.plugin(calendar);
Alpine.start();
```

```html
<div x-data="{ cal: $calendar({ weekStartsOn: 1 }) }">
  <div class="btn-group">
    <button type="button" @click="cal.prevMonth()">Previous</button>
    <strong x-text="cal.formatMonth()"></strong>
    <button type="button" @click="cal.nextMonth()">Next</button>
  </div>

  <div class="weekdays">
    <template x-for="label in cal.weekdayLabels" :key="label">
      <span x-text="label"></span>
    </template>
  </div>

  <template x-for="week in cal.weeks" :key="week[0].date.toISOString()">
    <div class="week">
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
</div>
```

## API summary

| | |
|-|-|
| **Magic** | `$calendar(options?)` |
| **Returns** | Independent `CalendarInstance` with month navigation, selection, grid data, and flexible `disabled` matchers |
| **Events** | `select`, `monthChange`, `clear` (via `CalendarController`) |

No UI is rendered — you build the markup and styles.

## Headless usage (no Alpine)

Import the controller directly — no Alpine dependency required:

```ts
import { CalendarController, createCalendar } from "@ailuracode/alpine-calendar";

// Via controller class
const controller = new CalendarController({ weekStartsOn: 1 });
controller.nextMonth();
controller.select(new Date());
console.log(controller.month);
controller.destroy();

// Via factory
const cal = createCalendar({ weekStartsOn: 1 });
```

The controller extends `BaseController` and emits typed events:

```ts
import { CalendarController } from "@ailuracode/alpine-calendar";

const controller = new CalendarController({ mode: "range" });

controller.on("select", (date) => {
  console.log("Selected:", date);
});

controller.on("monthChange", ({ month }) => {
  console.log("Navigated to:", month);
});
```

For backward compatibility, `toStore()` returns a store-shaped object matching the `CalendarInstance` interface.

## License

MIT
