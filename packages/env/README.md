# @ailuracode/alpine-env

Browser environment magics: `$network`, `$visibility`, `$battery`, and `$platform`.

**[Full documentation →](../../docs/plugins/env.md)**

## Install

```bash
pnpm add @ailuracode/alpine-env alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import env from "@ailuracode/alpine-env";

Alpine.plugin(env());
Alpine.start();
```

## Selective registration

```js
Alpine.plugin(env({ battery: false }));
```

## Headless controllers

This package also exports framework-agnostic controllers when you want the lifecycle without Alpine:

```js
import { createNetwork, createVisibility, createBattery, createPlatform } from "@ailuracode/alpine-env";

const network = createNetwork();
const stop = network.on("change", (detail) => {
  console.log(detail.isOnline);
});

stop();
network.destroy();
```

Controllers are lifecycle-aware:

- constructors do not touch browser globals
- subscriptions start in `mount()`
- `destroy()` is idempotent and removes registered listeners

## License

MIT
