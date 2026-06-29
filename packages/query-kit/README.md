# @ailuracode/alpine-query-kit

Query cache with Nanostores adapter and devtools panel — the recommended Alpine query stack.

**[Full documentation →](../../docs/plugins/query-kit.md)**

## Install

```bash
npm install @ailuracode/alpine-query-kit alpinejs nanostores @nanostores/alpine
```

## Quick example

```js
import Alpine from "alpinejs";
import queryKit from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKit());
Alpine.start();
```

## Without devtools

```js
Alpine.plugin(queryKit({ devtools: false }));
```

## License

MIT
