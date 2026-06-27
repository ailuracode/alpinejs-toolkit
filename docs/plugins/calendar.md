---
title: "Calendar"
description: "Package: @ailuracode/alpinejs-calendar"
---

Package: `@ailuracode/alpinejs-calendar`

Lightweight calendar logic for Alpine.js, powered by [date-fns](https://date-fns.org/). Registers callable magic `$calendar` that returns an independent calendar instance. The plugin does **not** render UI — you own the markup and styles.

## Install

```bash
npm install @ailuracode/alpinejs-calendar alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import calendar from "@ailuracode/alpinejs-calendar";

Alpine.plugin(calendar);
Alpine.start();
```

TypeScript consumers can add:

```ts
/// <reference types="@ailuracode/alpinejs-calendar/global" />
```

## Magic API

Callable factory:

| Usage | Returns | Description |
|-------|---------|-------------|
| `$calendar(options?)` | `CalendarInstance` | Creates an independent calendar logic instance |

Each call returns a new object with its own month, selection, and grid data.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `locale` | `Locale` | `enUS` | date-fns locale for labels and formatting |
| `weekStartsOn` | `0`–`6` | `0` | First day of the week (Sunday = `0`) |
| `minDate` | `Date` | — | Earliest selectable date |
| `maxDate` | `Date` | — | Latest selectable date |
| `mode` | `"single"` \| `"range"` \| `"multiple"` | `"single"` | Selection behavior |
| `month` | `Date` | current month | Initial visible month |
| `selected` | `Date` \| `Date[]` \| `{ from?, to? }` \| `null` | `null` | Initial selection |
| `disabled` | `CalendarMatcher` \| `CalendarMatcher[]` | — | Dates that cannot be selected |
| `dateFns` | `CalendarDateFnsOptions` | — | Extra date-fns context (locale, `in`, week options, format tokens) |

## Disabling dates

Use `disabled` with one matcher or an array. If **any** matcher matches, the date is disabled.

| Matcher | Description |
|---------|-------------|
| `true` | Disable all dates |
| `Date` | Disable a single day |
| `Date[]` | Disable specific days |
| `{ from, to }` | Disable an **inclusive** range (endpoints included) |
| `{ only: { from, to } }` | Disable everything **outside** the inclusive range |
| `{ before: Date }` | Disable dates strictly before the date (exclusive) |
| `{ after: Date }` | Disable dates strictly after the date (exclusive) |
| `{ before, after }` | Disable dates strictly between the bounds (exclusive endpoints) |
| `{ dayOfWeek: Day \| Day[] }` | Disable weekdays (`0` = Sunday) |
| `(date) => boolean` | Custom predicate — return `true` to disable |
| `CalendarMatcher[]` | Combine any of the above |

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

`minDate` / `maxDate` still apply on top of `disabled`.

## date-fns context

Pass [date-fns options](https://date-fns.org/) through `dateFns`. Top-level `locale` and `weekStartsOn` are shortcuts that merge into this context.

Supported fields include:

- `locale`
- `weekStartsOn`
- `firstWeekContainsDate`
- `useAdditionalWeekYearTokens`
- `useAdditionalDayOfYearTokens`
- `in` — context function for extensions such as [`TZDate`](https://github.com/date-fns/tz)

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

The resolved context is exposed on each instance as `cal.dateFns` and is passed to every internal date-fns call.

## Instance API

### State

| Property | Type | Description |
|----------|------|-------------|
| `month` | `Date` | Visible month (first day of month) |
| `mode` | `CalendarMode` | Selection mode |
| `selected` | `Date` \| `Date[]` \| `{ from?, to? }` \| `null` | Current selection |
| `locale` | `Locale` | Active locale |
| `weekStartsOn` | `0`–`6` | Week start day |
| `dateFns` | `CalendarDateFnsOptions` | Resolved date-fns context |
| `weeks` | `CalendarDay[][]` | Month grid for rendering |
| `weekdayLabels` | `string[]` | Localized weekday headers |

### Navigation

| Method | Description |
|--------|-------------|
| `prevMonth()` | Go to previous month |
| `nextMonth()` | Go to next month |
| `goToMonth(date)` | Jump to the month containing `date` |
| `goToToday()` | Jump to the current month |

### Selection

| Method | Description |
|--------|-------------|
| `select(date)` | Select or toggle a date (mode-dependent) |
| `clear()` | Clear the current selection |
| `matches(date, matcher)` | Check whether a date matches a matcher |

### Queries

| Method | Description |
|--------|-------------|
| `isSelected(date)` | Whether the date is selected |
| `isDisabled(date)` | Whether the date is outside `minDate` / `maxDate` |
| `isToday(date)` | Whether the date is today |
| `isSameMonth(date, month?)` | Whether the date belongs to a month |
| `isInRange(date)` | Range middle day (range mode) |
| `isRangeStart(date)` | Range start endpoint |
| `isRangeEnd(date)` | Range end endpoint |

### Formatting

| Method | Description |
|--------|-------------|
| `format(date, pattern)` | Format a date with the active locale |
| `formatMonth(month?)` | Format a month label (`LLLL yyyy`) |
| `formatYear(month?)` | Format a year label |

## HTML examples

### Single-date picker

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

### Range picker with bounds

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

### Spanish locale

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

Import helpers directly when you do not need the Alpine plugin:

```js
import { createCalendar } from "@ailuracode/alpinejs-calendar";

const cal = createCalendar({ weekStartsOn: 1 });
```

## SSR

The plugin does not touch `window` or `navigator` during initialization. Calendar instances only use `Date` and date-fns, so they are safe to create during SSR as long as you avoid rendering browser-only UI around them.
