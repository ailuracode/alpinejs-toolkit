# @ailuracode/alpinejs-toolkit

Modular **Alpine.js toolkit** — lazy plugin init, headless stores and magics, TypeScript-first DX. Framework-agnostic: works with Vite, Astro, static HTML, or any ESM bundler.

Built by **ailuracode**. Twenty-one independent npm packages; install only what you need.

## Why this exists

Alpine gives you reactivity in HTML. This monorepo adds **headless, tree-shakeable modules** coordinated by a **lazy registry** (`@ailuracode/alpinejs-core`):

- Register plugins without running them at import time
- Load plugin code on demand with dynamic `import()`
- Wire your own CSS — no Tailwind or `data-theme` baked in
- Push server or event payloads into `$toast.fromPayload()` when you need them

## Quick start

```bash
npm install alpinejs @ailuracode/alpinejs-core @ailuracode/alpinejs-theme @ailuracode/alpinejs-toast
```

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  defineStorePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpinejs-core";

function applyTheme({ resolved }) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

registerPlugin(
  "theme",
  defineStorePlugin(["theme"], async () => {
    const { default: theme } = await import("@ailuracode/alpinejs-theme");
    return theme({ onChange: applyTheme });
  })
);

registerPlugin("toast", lazyPlugin({
  kind: "magic",
  magics: ["toast"],
  import: () => import("@ailuracode/alpinejs-toast"),
}));

Alpine.plugin(createAlpinePlugin(["theme", "toast"]));
Alpine.start();
```

See [Getting started](./docs/getting-started.md) for essentials, lazy init, and HTML usage.

## Packages

### Core

| Package | Description |
|---------|-------------|
| [`@ailuracode/alpinejs-core`](./packages/core/README.md) | Lazy plugin registry, deferred init, dynamic imports |

### Essentials

Start here for most Alpine apps.

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpinejs-theme`](./packages/theme/README.md) | `$store.theme` | Light / dark / system preference |
| [`@ailuracode/alpinejs-screen`](./packages/screen/README.md) | `$store.device` | Responsive breakpoints |
| [`@ailuracode/alpinejs-scroll`](./packages/scroll/README.md) | `$store.scroll` | Scroll tracking and body lock |
| [`@ailuracode/alpinejs-sidebar`](./packages/sidebar/README.md) | `$store.sidebar` | Sidebar / drawer shell state |
| [`@ailuracode/alpinejs-toast`](./packages/toast/README.md) | `$toast` | Headless toast queue; `fromPayload` for plain objects |

### Extended

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpinejs-network`](./packages/network/README.md) | `$network` | Online / offline state |
| [`@ailuracode/alpinejs-visibility`](./packages/visibility/README.md) | `$visibility` | Tab visibility |
| [`@ailuracode/alpinejs-clipboard`](./packages/clipboard/README.md) | `$clipboard` | Copy to clipboard |
| [`@ailuracode/alpinejs-platform`](./packages/platform/README.md) | `$platform` | OS and platform detection |
| [`@ailuracode/alpinejs-touch`](./packages/touch/README.md) | `$touch` | Touch and pointer capabilities |
| [`@ailuracode/alpinejs-toggle`](./packages/toggle/README.md) | `$toggle` | Binary and ternary toggle state |

### Advanced

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpinejs-battery`](./packages/battery/README.md) | `$battery` | Battery level and charging |
| [`@ailuracode/alpinejs-geo`](./packages/geo/README.md) | `$store.geo` | Geolocation |
| [`@ailuracode/alpinejs-export`](./packages/export/README.md) | `$export` | Programmatic file downloads |
| [`@ailuracode/alpinejs-share`](./packages/share/README.md) | `$share` | Web Share API |
| [`@ailuracode/alpinejs-attention`](./packages/attention/README.md) | `$wakelock`, `$idle` | Wake Lock and Idle Detection |
| [`@ailuracode/alpinejs-notify`](./packages/notify/README.md) | `$notify` | Web Notifications |
| [`@ailuracode/alpinejs-calendar`](./packages/calendar/README.md) | `$calendar` | Calendar date logic (date-fns) |
| [`@ailuracode/alpinejs-json-api`](./packages/json-api/README.md) | `$jsonapi` | Typed JSON:API client |

### Query

| Package | Description |
|---------|-------------|
| [`@ailuracode/alpinejs-query`](./packages/query/README.md) | Store-agnostic query cache |
| [`@ailuracode/alpinejs-query-adapter-nanostores`](./packages/query-adapter-nanostores/README.md) | **Recommended** — Nanostores + `@nanostores/alpine` |
| [`@ailuracode/alpinejs-query-adapter-alpine`](./packages/query-adapter-alpine/README.md) | Native `Alpine.reactive` adapter |
| [`@ailuracode/alpinejs-query-adapter-zustand`](./packages/query-adapter-zustand/README.md) | Zustand vanilla adapter |
| [`@ailuracode/alpinejs-query-devtools`](./packages/query-devtools/README.md) | Query cache inspector |

## Demo app

The [`apps/demo/`](./apps/demo/) directory is a **Starlight documentation site** plus an interactive **playground**. It is part of the pnpm workspace and is **not** published to npm.

```bash
pnpm install
pnpm run dev:demo
```

- `/` — documentation (from [`docs/`](./docs/))
- `/playground/` — live Alpine.js demos (Essentials highlighted)

See [AGENTS.md](./AGENTS.md) for the full checklist when adding a plugin.

## Documentation

- [Getting started](./docs/getting-started.md) — lazy init, essentials, HTML usage
- [Core](./docs/core.md) — plugin registry
- **Essentials** — [theme](./docs/plugins/theme.md), [screen](./docs/plugins/screen.md), [scroll](./docs/plugins/scroll.md), [sidebar](./docs/plugins/sidebar.md), [toast](./docs/plugins/toast.md)
- [Query](./docs/query.md) · [Query devtools](./docs/query-devtools.md)
- [AGENTS.md](./AGENTS.md) — guide for AI agents and maintainers

## Development

```bash
pnpm install
pnpm test              # all packages
pnpm run lint          # biome check (strict)
pnpm run lint:fix      # auto-fix
pnpm run test:coverage # coverage thresholds
pnpm run pack:check    # validate npm tarballs
pnpm run changeset     # after user-facing changes
```

## Versioning & release

Uses [Changesets](https://github.com/changesets/changesets) for independent package versions.

```bash
pnpm run changeset   # create a changeset
pnpm run version     # bump versions + changelogs
pnpm run release     # test + publish to npm
```

GitHub Actions versions packages on the **same PR branch** that contains pending changesets, then publishes to npm on `master` after merge when no changesets remain. Set the `NPM_TOKEN` repository secret for automated npm publish.

## Publishing (manual)

Requires npm 2FA and access to `@ailuracode`:

```bash
npm login
pnpm run release
```

Each package under `packages/*` has its own version, tests, and README.

## License

MIT
