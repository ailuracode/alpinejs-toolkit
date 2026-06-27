# @ailuracode/alpinejs-battery

Battery status magic for Alpine.js.

**[Full documentation →](../../docs/plugins/battery.md)**

## Install

```bash
npm install @ailuracode/alpinejs-battery alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import battery from "@ailuracode/alpinejs-battery";

Alpine.plugin(battery);
Alpine.start();
```

```html
<div x-show="$battery.isAvailable">
  Battery: <span x-text="Math.round($battery.level * 100)"></span>%
  <span x-show="$battery.isCharging">(charging)</span>
</div>
```

## API summary

| | |
|-|-|
| **Magic** | `$battery` |
| **Properties** | `isAvailable`, `level`, `isCharging`, `chargingTime`, `dischargingTime` |

## License

MIT
