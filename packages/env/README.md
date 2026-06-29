# @ailuracode/alpine-env

Browser environment magics: `$network`, `$visibility`, `$battery`, and `$platform`.

**[Full documentation →](../../docs/plugins/env.md)**

## Install

```bash
npm install @ailuracode/alpine-env alpinejs
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

## License

MIT
