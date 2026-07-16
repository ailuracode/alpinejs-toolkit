# @ailuracode/alpinejs-toolkit

Modular **Alpine.js toolkit** — headless stores, magics, directives, and shared infrastructure. TypeScript-first, tree-shakeable, SSR-safe. Framework-agnostic: works with Vite, Astro, static HTML, or any ESM bundler.

Built by **ailuracode**. **39 independent npm packages**; install only what you need.

## Why this exists

Alpine gives you reactivity in HTML. This monorepo adds **headless, framework-agnostic modules** coordinated by two shared layers:

- **`@ailuracode/alpine-core`** — controller primitives (`BaseController`, `EventEmitter`, `CleanupStack`, `ToolkitError`), the singleton registry, and Alpine **registration guards** that throw `RegistrationError` on collisions instead of silently overwriting your `$store`.
- **`@ailuracode/alpine-ui`** — SSR-safe infrastructure primitives shared by feature packages: `createLocalStorageAdapter`, `createMemoryAdapter`, `createMediaQueryListener`, `createPortalRoot`.

You wire your own CSS — no Tailwind or `data-theme` baked in. Plugin logic lives in headless controllers so you can drive state from any stack (Blade, Livewire, Astro, vanilla TS) and bridge it into Alpine when you want reactive UIs.

## Quick start

```bash
pnpm add alpinejs \
  @ailuracode/alpine-core \
  @ailuracode/alpine-ui \
  @ailuracode/alpine-theme \
  @ailuracode/alpine-media \
  @ailuracode/alpine-scroll \
  @ailuracode/alpine-toast
```

```js
import Alpine from "alpinejs";
import { themePlugin } from "@ailuracode/alpine-theme";
import { mediaPlugin } from "@ailuracode/alpine-media";
import { scrollPlugin } from "@ailuracode/alpine-scroll";
import { toastPlugin } from "@ailuracode/alpine-toast";

Alpine.plugin(themePlugin());
Alpine.plugin(mediaPlugin());
Alpine.plugin(scrollPlugin());
Alpine.plugin(toastPlugin());
Alpine.start();

// Theme is CSS-framework agnostic — apply your own classes via subscribe:
Alpine.store("theme").on("change", (detail) => {
  document.documentElement.classList.toggle("dark", detail.resolved === "dark");
});
```

Code-split heavy plugins with dynamic `import()`:

```js
import Alpine from "alpinejs";

const plugins = [
  () => import("@ailuracode/alpine-theme").then((m) => m.themePlugin()),
  () => import("@ailuracode/alpine-media").then((m) => m.mediaPlugin()),
  () => import("@ailuracode/alpine-toast").then((m) => m.toastPlugin()),
];

await Promise.all(plugins.map((load) => load().then((p) => Alpine.plugin(p))));
Alpine.start();
```

See [Getting started](./docs/getting-started.md) for HTML usage, registration guards, and CDN patterns.

## Packages

### Core & infrastructure

| Package | Description |
|---------|-------------|
| [`@ailuracode/alpine-core`](./packages/core/README.md) | Controller primitives, singleton registry, Alpine registration guards, controller↔store/directive bridge |
| [`@ailuracode/alpine-ui`](./packages/ui/README.md) | SSR-safe storage adapters, media query helpers, portal roots — shared by feature packages |

### Essentials

Start here for most Alpine apps.

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpine-theme`](./packages/theme/README.md) | `$store.theme`, `$theme` | Light / dark / system preference, headless `ThemeController` |
| [`@ailuracode/alpine-media`](./packages/media/README.md) | `$store.media` | Viewport breakpoints and media features |
| [`@ailuracode/alpine-scroll`](./packages/scroll/README.md) | `$store.scroll` | Scroll tracking and body lock for overlays |
| [`@ailuracode/alpine-sidebar`](./packages/sidebar/README.md) | `$store.sidebar` | Sidebar / drawer shell state |
| [`@ailuracode/alpine-lang`](./packages/lang/README.md) | `$store.lang` | Browser-language detection and reactive current-language store |

### Extended

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpine-env`](./packages/env/README.md) | `$network`, `$visibility`, `$battery`, `$platform` | Browser environment magics |
| [`@ailuracode/alpine-transfer`](./packages/transfer/README.md) | `$clipboard`, `$share`, `$export` | Outbound data transfer magics |
| [`@ailuracode/alpine-toggle`](./packages/toggle/README.md) | `$toggle` | Binary and ternary toggle state machines |
| [`@ailuracode/alpine-timer`](./packages/timer/README.md) | `$timer` | Countdown, countup, and stopwatch factories |
| [`@ailuracode/alpine-form`](./packages/form/README.md) | `$store.form` | Headless form state, validation, and submission lifecycle |
| [`@ailuracode/alpine-child`](./packages/child/README.md) | `x-child` | asChild-style attribute transfer to first child |
| [`@ailuracode/alpine-gesture`](./packages/gesture/README.md) | `$store.gesture`, `x-gesture` | Headless gesture recognition — tap, swipe, pan, pinch, long press |

### Headless UI

| Package | API | Description |
|---------|-----|-------------|
| [`@ailuracode/alpine-overlay`](./packages/overlay/README.md) | `$store.overlay` | Portal root, z-index stack, overlay registry |
| [`@ailuracode/alpine-permissions`](./packages/permissions/README.md) | `$store.permissions`, `$permissions` | Browser permission registry + adapter contract |
| [`@ailuracode/alpine-keyboard`](./packages/keyboard/README.md) | `$store.keyboard`, `$keyboard` | Scoped keyboard shortcut registry with chords and sequences |
| [`@ailuracode/alpine-dialog`](./packages/dialog/README.md) | `$store.dialog` | Accessible modal state and focus trap |
| [`@ailuracode/alpine-menu`](./packages/menu/README.md) | `$store.menu` | Exclusive dropdown/context menu keyboard navigation |
| [`@ailuracode/alpine-tooltip`](./packages/tooltip/README.md) | `$store.tooltip` | Tooltip positioning and delays |
| [`@ailuracode/alpine-toast`](./packages/toast/README.md) | `$store.toast`, `$toast` | Headless toast queue; `fromPayload` for plain objects |
| [`@ailuracode/alpine-tabs`](./packages/tabs/README.md) | `$store.tabs` | Accessible tabs with URL sync |
| [`@ailuracode/alpine-accordion`](./packages/accordion/README.md) | `$store.accordion` | Single/multi accordion state |
| [`@ailuracode/alpine-command`](./packages/command/README.md) | `$store.command` | Command palette / Spotlight |
| [`@ailuracode/alpine-carousel`](./packages/carousel/README.md) | `$store.carousel` | Embla-powered accessible carousel |
| [`@ailuracode/alpine-virtual`](./packages/virtual/README.md) | `$store.virtual`, `$virtual` | Headless virtual list controller |
| [`@ailuracode/alpine-selection`](./packages/selection/README.md) | `$store.selection`, `$selection` | Headless selection primitives |
| [`@ailuracode/alpine-collection`](./packages/collection/README.md) | `createCollectionController<T, K>()` | Headless filter/sort/group/paginate controller (no Alpine plugin yet) |
| [`@ailuracode/alpine-history`](./packages/history/README.md) | `$store.history`, `$history` | Headless undo/redo history controller |
| [`@ailuracode/alpine-realtime`](./packages/realtime/README.md) | `$store.realtime`, `$realtime` | Headless realtime transport (SSE/WebSocket via `realtimePlugin` from `@ailuracode/alpine-realtime/alpine`) |

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
| [`@ailuracode/alpine-query`](./packages/query/README.md) | Store-agnostic query cache (`createQueryClient`, `query({ adapter })`) |
| [`@ailuracode/alpine-query-kit`](./packages/query-kit/README.md) | **Recommended** — query + Nanostores adapter; headless main entry |
| [`@ailuracode/alpine-query-kit/devtools`](./packages/query-kit/README.md#devtools) | Styled Query Devtools panel (development-only subpath, **ALP-36 exception**) |
| [`@ailuracode/alpine-query-adapter-alpine`](./packages/query-adapter-alpine/README.md) | Native `Alpine.reactive` adapter |
| [`@ailuracode/alpine-query-adapter-zustand`](./packages/query-adapter-zustand/README.md) | Zustand vanilla adapter |

## Demo app

The [`apps/demo/`](./apps/demo/) directory is a **Starlight** documentation site plus an interactive **playground**. It is part of the pnpm workspace and is **not** published to npm.

```bash
pnpm install
pnpm run dev:demo
```

- `/` — documentation site (Starlight, from Starlight pages in `apps/demo/src/pages`)
- `/playground/` — live Alpine.js demos (Essentials highlighted)

See [AGENTS.md](./AGENTS.md) for the full checklist when adding a plugin or package.

## Documentation

- [Getting started](./docs/getting-started.md) — install, registration, HTML usage, CDN
- [Plugin events](./docs/guides/plugin-events.md) — typed `on`/`once`/`off` and event lifecycle
- [Permissions](./docs/guides/permissions.md) — adapter contract for browser permissions
- [Query stack](./docs/guides/query-stack.md) — store-agnostic cache and adapters
- [Device detection](./docs/device-detection.md) — media/env/toggle/realtime cross-package patterns
- [E2E testing](./docs/e2e-testing.md) — Playwright harness and conventions
- Plugin reference: see each package's `README.md` (canonical, npm-published)
- [Toggle reference](./docs/plugins/toggle.md) — single canonical plugin doc kept under `docs/plugins/`
- [AGENTS.md](./AGENTS.md) — guide for AI agents and maintainers

## Development

```bash
pnpm install                      # install all workspaces
pnpm test                         # full test suite (required before release)
pnpm run lint                     # biome check (strict)
pnpm run lint:fix                 # auto-fix
pnpm run format                   # biome format --write
pnpm run typecheck                # tsc --noEmit across packages
pnpm run build                    # compile all packages to dist/
pnpm run test:coverage            # coverage thresholds
pnpm run pack:check               # pnpm pack dry-run for publishable packages
pnpm run repo:check               # validate monorepo wiring consistency
pnpm run repo:check:built         # repo:check plus built export artifact validation
pnpm run architecture:check       # enforce source-level architecture invariants
pnpm run changeset:check          # verify pending changesets
pnpm test:watch                   # vitest watch mode
pnpm run test:e2e                 # Playwright E2E suite
pnpm run test:e2e:affected        # E2E only on affected packages
pnpm run size                     # per-package size-limit budgets
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
