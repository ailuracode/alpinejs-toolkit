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

## Headless controller

Use the controller subpath when you want lifecycle-managed environment state without Alpine:

```js
import { createEnv } from "@ailuracode/alpine-env/controller";

const env = createEnv();
const stop = env.on("change", (detail) => {
  console.log(detail.network.isOnline);
});

stop();
env.destroy();
```

The controller is lifecycle-aware:

- constructors do not touch browser globals
- subscriptions start in `mount()`
- `destroy()` is idempotent and removes registered listeners

The root package stays focused on Alpine integration. Import `@ailuracode/alpine-env` for magics, and `@ailuracode/alpine-env/controller` for headless usage.

## License

MIT
