# @ailuracode/alpine-plugin-registry

Lazy plugin registry and Alpine initializer for
[`@ailuracode/alpinejs-toolkit`](https://github.com/ailuracode/alpinejs-toolkit).

Use this package in application entrypoints. Feature packages depend on
`@ailuracode/alpine-core` subpaths instead.

## Install

```bash
pnpm add @ailuracode/alpine-plugin-registry @ailuracode/alpine-core alpinejs
```

## Quick start

```ts
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  definePlugin,
  pluginLoader,
  registerPlugin,
} from "@ailuracode/alpine-plugin-registry";
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], {
    names: ["theme"],
    plugin: pluginLoader(() => themePlugin()),
  }),
);

Alpine.plugin(createAlpinePlugin(["theme"]));
Alpine.start();
```

## License

MIT
