# @ailuracode/alpinejs-toolkit

Modular **Alpine.js toolkit** — lazy plugin init, headless stores and magics, TypeScript-first DX. Framework-agnostic: works with Vite, Astro, static HTML, or any ESM bundler.

Built by **ailuracode**. 35 independent npm packages; install only what you need.


## Why this exists

Alpine gives you reactivity in HTML. This monorepo adds **headless, tree-shakeable modules** coordinated by a **lazy registry** (`@ailuracode/alpine-core`):

- Register plugins without running them at import time
- Load plugin code on demand with dynamic `import()`
- Wire your own CSS — no Tailwind or `data-theme` baked in
- Push server or event payloads into `$toast.fromPayload()` when you need them

## Quick start

```bash
pnpm add alpinejs @ailuracode/alpine-core @ailuracode/alpine-theme @ailuracode/alpine-toast
```

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  definePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpine-core";
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], {
    names: ["theme"],
    plugin: () => themePlugin(),
  })
);

registerPlugin(
  "toast",
  lazyPlugin(["magic"], {
    names: ["toast"],
    import: () => import("@ailuracode/alpine-toast"),
  })
);

Alpine.plugin(createAlpinePlugin(["theme", "toast"]));
Alpine.start();

// Theme is CSS-framework agnostic — wire your own classes via subscribe:
Alpine.store("theme").on("change", (detail) => {
  document.documentElement.classList.toggle("dark", detail.resolved === "dark");
});
```

See [Getting started](./docs/getting-started.md) for essentials, lazy init, and HTML usage.

## Packages

### Core

| Package | Description |
|---------|-------------|
| [`@ailuracode/alpine-core`](./packages/core/README.md) | Lazy plugin registry, deferred init, dynamic imports |

### Essentials

Start here for most Alpine apps.

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpine-theme`](./packages/theme/README.md) | `$store.theme` | Light / dark / system preference |
| [`@ailuracode/alpine-media`](./packages/media/README.md) | `$store.media` | Viewport breakpoints and media features |
| [`@ailuracode/alpine-scroll`](./packages/scroll/README.md) | `$store.scroll` | Scroll tracking and body lock |
| [`@ailuracode/alpine-sidebar`](./packages/sidebar/README.md) | `$store.sidebar` | Sidebar / drawer shell state |
| [`@ailuracode/alpine-lang`](./packages/lang/README.md) | `$store.lang` | Browser-language detection and reactive current-language store |

### Extended

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpine-env`](./packages/env/README.md) | `$network`, `$visibility`, `$battery`, `$platform` | Browser environment magics; headless API at `@ailuracode/alpine-env/controller` |
| [`@ailuracode/alpine-transfer`](./packages/transfer/README.md) | `$clipboard`, `$share`, `$export` | Outbound data transfer |
| [`@ailuracode/alpine-toggle`](./packages/toggle/README.md) | `$toggle` | Binary and ternary toggle state |
| [`@ailuracode/alpine-child`](./packages/child/README.md) | `x-child` | asChild-style attribute transfer to first child |
| [`@ailuracode/alpine-gesture`](./packages/gesture/README.md) | `$store.gesture`, `x-gesture` | Headless gesture recognition — tap, swipe, pan, pinch, long press |

### Headless UI

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpine-overlay`](./packages/overlay/README.md) | `$store.overlay` | Portal root, z-index stack, overlay registry |
| [`@ailuracode/alpine-permissions`](./packages/permissions/README.md) | `$store.permissions` | Unified browser permission registry and adapter contract |
| [`@ailuracode/alpine-keyboard`](./packages/keyboard/README.md) | `$store.keyboard` | Scoped keyboard shortcut registry with chords and sequences |
| [`@ailuracode/alpine-dialog`](./packages/dialog/README.md) | `$store.dialog` | Accessible modal state and focus trap |
| [`@ailuracode/alpine-menu`](./packages/menu/README.md) | `$store.menu` | Exclusive dropdown/context menu keyboard navigation |
| [`@ailuracode/alpine-tooltip`](./packages/tooltip/README.md) | `$store.tooltip` | Tooltip positioning and delays |
| [`@ailuracode/alpine-toast`](./packages/toast/README.md) | `$toast` | Headless toast queue; `fromPayload` for plain objects |
| [`@ailuracode/alpine-tabs`](./packages/tabs/README.md) | `$store.tabs` | Accessible tabs with URL sync |
| [`@ailuracode/alpine-accordion`](./packages/accordion/README.md) | `$store.accordion` | Single/multi accordion state |
| [`@ailuracode/alpine-command`](./packages/command/README.md) | `$store.command` | Command palette / Spotlight |
| [`@ailuracode/alpine-carousel`](./packages/carousel/README.md) | `$store.carousel` | Embla-powered accessible carousel |
| [`@ailuracode/alpine-virtual`](./packages/virtual/README.md) | `$store.virtual` | Headless virtual list controller |
| [`@ailuracode/alpine-selection`](./packages/selection/README.md) | `$store.selection` | Framework-agnostic selection primitives |
| [`@ailuracode/alpine-collection`](./packages/collection/README.md) | `createCollectionController<T, K>()` | Headless collection primitives — filter, sort, group, paginate |
| [`@ailuracode/alpine-history`](./packages/history/README.md) | `$store.history` | Headless undo/redo history controller |
| [`@ailuracode/alpine-realtime`](./packages/realtime/README.md) | `$store.realtime` | Headless realtime transport (SSE/WebSocket) |

### Advanced

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpine-geo`](./packages/geo/README.md) | `$store.geo` | Geolocation |
| [`@ailuracode/alpine-attention`](./packages/attention/README.md) | `$wakelock`, `$idle` | Wake Lock and Idle Detection |
| [`@ailuracode/alpine-notify`](./packages/notify/README.md) | `$notify` | Web Notifications |
| [`@ailuracode/alpine-calendar`](./packages/calendar/README.md) | `$calendar` | Calendar date logic (date-fns) |
| [`@ailuracode/alpine-json-api`](./packages/json-api/README.md) | `$jsonapi` | Typed JSON:API client |

### Query

| Package | Description |
|---------|-------------|
| [`@ailuracode/alpine-query`](./packages/query/README.md) | Store-agnostic query cache |
| [`@ailuracode/alpine-query-kit`](./packages/query-kit/README.md) | **Recommended** — query + Nanostores adapter + devtools |
| [`@ailuracode/alpine-query-adapter-alpine`](./packages/query-adapter-alpine/README.md) | Native `Alpine.reactive` adapter |
| [`@ailuracode/alpine-query-adapter-zustand`](./packages/query-adapter-zustand/README.md) | Zustand vanilla adapter |

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
- **Essentials** — [theme](./docs/plugins/theme.md), [media](./docs/plugins/media.md), [scroll](./docs/plugins/scroll.md), [sidebar](./docs/plugins/sidebar.md), [lang](./docs/plugins/lang.md)
- **Headless UI** — [dialog](./docs/plugins/dialog.md), [menu](./docs/plugins/menu.md), [tooltip](./docs/plugins/tooltip.md), [toast](./docs/plugins/toast.md), [tabs](./docs/plugins/tabs.md), [accordion](./docs/plugins/accordion.md), [command](./docs/plugins/command.md), [carousel](./docs/plugins/carousel.md), [virtual](./docs/plugins/virtual.md)
- [Query](./docs/query.md) · [Query devtools](./docs/plugins/query-kit.md#devtools)
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

This repository uses **manual publishing** with [Changesets](https://github.com/changesets/changesets). CI (`ci.yml`) only validates — it never versions or publishes. A maintainer performs the release locally.

```bash
pnpm run changeset   # 1. add a changeset after a user-facing change
pnpm run version     # 2. bump versions + generate CHANGELOGs (commits the bump)
pnpm run release     # 3. build + test + publish changed packages to npm
```

### Release procedure (single source of truth)

1. **Versioning** — create a changeset for every consumer-observable change (`patch` bug fix, `minor` new API, `major` breaking). Run `pnpm run version` to apply pending changesets, which bumps `package.json` versions and appends CHANGELOG entries. Commit the result.
2. **Changelog** — Changesets writes `CHANGELOG.md` per package automatically; no manual edit needed.
3. **npm publishing** — requires npm 2FA and access to the `@ailuracode` scope. Authenticate with `npm login`, then `pnpm run release` (builds, runs tests, and publishes unpublished versions via `changeset publish`).
4. **Provenance** — publishes use `publishConfig.access: "public"`. Configure npm provenance per package if your account supports it; it is opt-in and does not block manual release.
5. **Failure recovery** — if publish partially fails, rerun `pnpm run release` after fixing the cause. Changesets only publishes versions not yet on the registry, so already-published packages are skipped.

> CI and release permissions are intentionally separate: the GitHub Actions workflow has no `NPM_TOKEN` and cannot publish. Only a maintainer with npm credentials can.

Each package under `packages/*` has its own version, tests, and README.

## License

MIT
