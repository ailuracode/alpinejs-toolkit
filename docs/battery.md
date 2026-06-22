# Battery

Package: `@ailuracode/alpine-battery`

Reactive battery status via the `$battery` magic. Wraps the [Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API) when `navigator.getBattery()` is available.

## Install

```bash
npm install @ailuracode/alpine-battery alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import battery from "@ailuracode/alpine-battery";

Alpine.plugin(battery);
Alpine.start();
```

## Magic API

| Property | Type | Description |
|----------|------|-------------|
| `isAvailable` | `boolean` | `true` when battery data is supported and loaded |
| `level` | `number \| null` | Charge level from `0` to `1`, or `null` when unavailable |
| `isCharging` | `boolean` | `true` when the device is charging |
| `chargingTime` | `number \| null` | Seconds until fully charged, or `null` when unknown |
| `dischargingTime` | `number \| null` | Seconds until empty, or `null` when unknown |

## HTML examples

```html
<div x-show="$battery.isAvailable" class="battery-widget">
  <span x-text="Math.round($battery.level * 100) + '%'"></span>
  <span x-show="$battery.isCharging">Charging</span>
</div>

<div x-show="!$battery.isAvailable">
  Battery status not available on this device
</div>

<div
  x-show="$battery.isAvailable && $battery.level < 0.2 && !$battery.isCharging"
  class="low-battery-warning"
>
  Low battery
</div>
```

## Notes

- Browser support is limited — many desktop browsers do not expose battery data
- Use `isAvailable` before reading `level` or charging state
- `level` is a fraction (`0.5` = 50%); multiply by `100` for a percentage in templates
- `chargingTime` and `dischargingTime` are `null` when the API reports `Infinity`
- Read-only — no store, no persistence
