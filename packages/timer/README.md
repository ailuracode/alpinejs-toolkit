# @ailuracode/alpine-timer

Generic reactive timer engine for Alpine.js with countdown, countup, and stopwatch presets.

## Install

```bash
pnpm add @ailuracode/alpine-timer @ailuracode/alpine-core alpinejs
```

## Quick start

```ts
import timerPlugin from "@ailuracode/alpine-timer";

Alpine.plugin(timerPlugin());
```

```html
<div x-data="{ timer: $timer.countdown({ duration: 60_000 }) }">
  <span x-text="timer.formatted"></span>
  <button @click="timer.toggle()">
    <span x-text="timer.running ? 'Pause' : 'Start'"></span>
  </button>
  <button @click="timer.reset()">Reset</button>
</div>
```

## Magic API

`$timer` exposes four factories:

| Method | Description |
|--------|-------------|
| `$timer.create(options)` | Low-level primitive |
| `$timer.countdown(options)` | Countdown preset (`direction: 'down'`) |
| `$timer.countup(options?)` | Countup preset (`direction: 'up'`) |
| `$timer.stopwatch(options?)` | Unlimited countup with lap recording |

### Generic timer

```html
<div
  x-data="{
    timer: $timer.create({
      direction: 'down',
      duration: 5_000,
      onComplete() {
        console.log('Completed');
      },
    }),
  }"
>
  <span x-text="timer.formatted"></span>
  <button @click="timer.start()">Start</button>
  <button @click="timer.pause()">Pause</button>
  <button @click="timer.resume()">Resume</button>
  <button @click="timer.restart()">Restart</button>
</div>
```

### Countdown

Equivalent to `$timer.create({ direction: 'down', duration })`. The default formatter shows **remaining** time (counts down).

### Countup

Equivalent to `$timer.create({ direction: 'up' })`. Pass `limit` for a bounded countup.

### Stopwatch

```html
<div x-data="{ stopwatch: $timer.stopwatch() }">
  <strong x-text="stopwatch.formatted"></strong>
  <button @click="stopwatch.toggle()">
    <span x-text="stopwatch.running ? 'Pause' : 'Start'"></span>
  </button>
  <button @click="stopwatch.lap()" :disabled="!stopwatch.running">Lap</button>
  <button @click="stopwatch.reset()">Reset</button>

  <template x-for="lap in stopwatch.laps" :key="lap.id">
    <div>
      <span x-text="`#${lap.index}`"></span>
      <span x-text="lap.formatted"></span>
      <span x-text="lap.splitFormatted"></span>
    </div>
  </template>
</div>
```

## Controller API

Every factory returns a reactive controller with:

- `direction`, `running`, `paused`, `completed`
- `elapsed`, `remaining`, `duration`, `progress`, `formatted`, `iteration`
- `start()`, `pause()`, `resume()`, `toggle()`, `reset()`, `restart()`, `dispose()`

Stopwatch controllers also expose:

- `laps`, `lastLap`, `fastestLap`, `slowestLap`
- `lap()`, `removeLap(id)`, `clearLaps()`

## Options

```ts
interface CreateTimerOptions {
  direction?: "up" | "down";
  duration?: number;
  initialElapsed?: number;
  autoStart?: boolean;
  precision?: number;
  repeat?: boolean | number;
  format?: TimerFormatter;
  onTick?: (timer: TimerSnapshot) => void;
  onComplete?: (timer: TimerSnapshot) => void;
}
```

## Standalone usage (no Alpine)

```ts
import { createTimer, countdown, countup, stopwatch } from "@ailuracode/alpine-timer";

const timer = countdown({ duration: 10_000 });
timer.start();
```

## Formatting helpers

```ts
import { formatDuration, formatStopwatch } from "@ailuracode/alpine-timer";

formatDuration(65_432); // "01:05"
formatStopwatch(65_432); // "01:05.432"
```

Custom formatting:

```ts
$timer.stopwatch({
  format: ({ minutes, seconds, milliseconds }) =>
    `${minutes}:${seconds}.${milliseconds}`,
});
```

## Browser, SSR, and lifecycle

- Timers are component state — create them inside `x-data`.
- Active schedulers are cleaned up when Alpine destroys the owning component.
- `dispose()` remains available for manual teardown.
- Importing the package is SSR-safe; scheduling starts only after `start()` or `autoStart`.

## License

MIT
