# @ailuracode/alpine-calendar

Lightweight calendar date logic for Alpine.js, powered by [date-fns](https://date-fns.org/).

**[Full documentation →](../../docs/calendar.md)**

## Install

```bash
npm install @ailuracode/alpine-calendar alpinejs
```

## Quick example

```js
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

No UI is rendered — you build the markup and styles.

## License

MIT
