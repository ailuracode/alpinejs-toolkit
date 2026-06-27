# AGENTS.md

Guidance for AI agents and contributors working on **@ailuracode/alpinejs-toolkit**.

## Project

Alpine.js plugin monorepo by **ailuracode**. Twenty-one independent npm packages under `packages/`, plus shared tests and docs. The root package `@ailuracode/alpinejs-toolkit` is **private** and never published.

| Package | Type | Store / Magic |
|---------|------|---------------|
| `@ailuracode/alpine-core` | Core | Plugin registry (`registerPlugin`, `initPlugins`) |
| `@ailuracode/alpine-theme` | Store | `$store.theme` |
| `@ailuracode/alpine-screen` | Store | `$store.device` |
| `@ailuracode/alpine-scroll` | Store | `$store.scroll` |
| `@ailuracode/alpine-sidebar` | Store | `$store.sidebar` |
| `@ailuracode/alpine-lang` | Store | `$store.lang` |
| `@ailuracode/alpine-network` | Magic | `$network` |
| `@ailuracode/alpine-visibility` | Magic | `$visibility` |
| `@ailuracode/alpine-battery` | Magic | `$battery` |
| `@ailuracode/alpine-clipboard` | Magic | `$clipboard` |
| `@ailuracode/alpine-toast` | Magic | `$toast` — headless queue (no markup/CSS) |
| `@ailuracode/alpine-export` | Magic | `$export` |
| `@ailuracode/alpine-calendar` | Magic | `$calendar` |
| `@ailuracode/alpine-touch` | Magic | `$touch` |
| `@ailuracode/alpine-toggle` | Magic | `$toggle` |
| `@ailuracode/alpine-platform` | Magic | `$platform` |
| `@ailuracode/alpine-notify` | Magic | `$notify` |
| `@ailuracode/alpine-geo` | Store | `$store.geo` |
| `@ailuracode/alpine-share` | Magic | `$share` |
| `@ailuracode/alpine-attention` | Magic | `$wakelock`, `$idle` |
| `@ailuracode/alpine-query` | Core | Store-agnostic query cache (`createQueryClient`, `query({ adapter })`) |
| `@ailuracode/alpine-json-api` | Magic | `$jsonapi` — typed JSON:API client |
| `@ailuracode/alpine-query-adapter-nanostores` | Plugin | **Recommended** — Nanostores + `@nanostores/alpine` |
| `@ailuracode/alpine-query-adapter-alpine` | Plugin | Native `Alpine.reactive` adapter |
| `@ailuracode/alpine-query-adapter-zustand` | Plugin | Zustand vanilla adapter |
| `@ailuracode/alpine-query-devtools` | Plugin | Query cache devtools panel |

## Repository layout

```
packages/<name>/src/index.ts   # plugin source (TypeScript)
packages/<name>/dist/            # compiled output published to npm
packages/<name>/test/            # Vitest tests
packages/<name>/README.md        # npm package readme
docs/                            # full documentation
test/                            # shared test setup (setup.ts, helpers.ts, mock-alpine.ts)
.changeset/                      # versioning changesets
.github/workflows/               # CI checks
```

## Commands

```bash
pnpm install          # install all workspaces
pnpm run build        # compile all packages to dist/
pnpm run typecheck    # TypeScript check without emit
pnpm test             # run full test suite (required before release)
pnpm run lint         # biome check (strict)
pnpm run lint:fix     # biome check --write
pnpm run format       # biome format --write
pnpm run test:coverage # vitest with coverage thresholds
pnpm run pack:check   # pnpm pack dry-run for all workspaces
pnpm run changeset:check # verify pending changesets
pnpm run test:watch   # vitest watch mode
pnpm run changeset    # create a changeset after user-facing changes
pnpm run version      # apply changesets → bump package.json versions + CHANGELOGs
pnpm run release      # test + publish changed packages to npm
```

Do **not** bump `version` in `package.json` manually for releases — use Changesets.

## Code conventions

### Stores vs magics

- **Store** — shared mutable state, actions, cross-component coordination (`theme`, `screen`, `scroll`).
- **Magic** — read-only environment data or one-off utilities (`network`, `touch`, `clipboard`).

### Naming

- npm scope: `@ailuracode/alpine-*`
- Author: `ailuracode` (not `airluracode`)
- Boolean derived state: **getters** — `$store.theme.isLight`, `$network.isOnline` (no `()` in templates)
- Actions: **methods** — `$store.theme.set('dark')`, `$store.scroll.lock()`
- Avoid React patterns: no `use*Store`, no hooks naming

### CSS

Plugins must stay **CSS-framework agnostic**. Do not hardcode `data-theme`, Tailwind `.dark`, or similar in plugin source. The consumer applies styles via callbacks (e.g. `theme({ onChange })`, `scroll({ onLockChange })`).

### Plugin shape

```js
export default function myPlugin(Alpine) {
  Alpine.store("name", { /* ... */ });
  // or
  Alpine.magic("name", () => state);
}
```

Factory plugins (e.g. theme) return the register function:

```js
export default function themePlugin(options = {}) {
  return function registerTheme(Alpine) { /* ... */ };
}
```

### Query cache (store-agnostic core)

The query engine is **agnostic to any store library**. Reactivity is injected via `QueryStateAdapter`:

- **`@ailuracode/alpine-query`** — cache core only (`QueryCache`, `createQueryClient`, `query({ adapter })`, `vanillaQueryAdapter`)
- **`@ailuracode/alpine-query-adapter-nanostores`** — **recommended** for Alpine; uses Nanostores + [`@nanostores/alpine`](https://github.com/nanostores/alpine) (`x-nano`, `$nano`)
- **`@ailuracode/alpine-query-adapter-alpine`** — native `Alpine.reactive`, zero external store deps
- **`@ailuracode/alpine-query-adapter-zustand`** — Zustand vanilla stores; no official zustand-alpine exists — manual `subscribe` → `Alpine.reactive` bridge
- **`createAlpineBridgedAdapter(Alpine, base)`** — shared bridge in core for adapter plugins
- **Devtools** — work with any adapter via the `QueryStore` surface

Do not couple `QueryCache` directly to Nanostores, Zustand, or Alpine.reactive — use adapter packages.

## Testing

- Framework: Vitest + happy-dom
- Include pattern: `packages/*/test/**/*.test.ts`
- Store plugins: use `startAlpine()` from `test/helpers.ts`
- Magic plugins: use `createMagicHarness()` from `test/mock-alpine.ts`
- Query cache logic: use `createQueryClient()` with `vanillaQueryAdapter` (default) or an adapter from `@ailuracode/alpine-query-adapter-*`; use `startAlpine(query({ adapter: createAlpineNanostoresAdapter }))` for Alpine integration tests
- `matchMedia`: use `setMatchMedia()` from `test/setup.ts`

Every change to plugin behavior must include or update tests. Run `pnpm test` and `pnpm run lint` before finishing.

## Linting & formatting

[Biome](https://biomejs.dev/) with strict rules (`biome.json`):

```bash
pnpm run lint       # check only (CI)
pnpm run lint:fix   # auto-fix safe issues
pnpm run format     # format all files
```

## Versioning & Publishing (manual)

1. After a user-facing change, run `pnpm run changeset`.
2. Select affected package(s) and semver bump (`patch`, `minor`, `major`).
3. Write a short changelog summary (English).

When ready to release:

```bash
pnpm run version        # apply changesets → bump versions + CHANGELOGs
pnpm run build          # compile all packages
pnpm test               # verify everything
npm login               # one-time: authenticate with npm
pnpm run release        # publishes changed packages to npm
```

Packages are versioned **independently**. One changeset can touch multiple packages.

**New packages:** set `"version": "0.0.0"` in `package.json`. A `minor` changeset then produces the first publishable version (`0.1.0`). Do **not** start at `0.1.0` with a `minor` changeset — Changesets will bump to `0.2.0` before the first npm release.

### Requirements

- Registry: npm, scope `@ailuracode`, public access
- Requires npm 2FA or granular token with publish permission
- Authenticate: `npm login` (manual, not CI)

## Documentation

When changing public API or behavior, update:

1. `docs/<package>.md`
2. `packages/<name>/README.md`
3. Root `README.md` if the package list or workflow changes

All docs in **English**.

## Demo app

`apps/demo/` is the Astro **documentation site** (Starlight) and **playground** in the pnpm workspace. It is **private** and excluded from publish and changesets. Run it with `pnpm run dev:demo` from the repo root.

- **Docs** — `docs/` at repo root is the Starlight source of truth (YAML frontmatter + Markdown, no sync step). Guides at the locale root (`getting-started.md`, `core.md`, `query.md`, …); plugin reference under `docs/plugins/` (and `docs/es/plugins/`, `docs/pt/plugins/`). Do not repeat the page `# title` in the body — Starlight renders `title` from frontmatter. `apps/demo/src/content/docs` is a symlink to `../../../../docs`.
- **Playground** — interactive demos at `/playground/` (`src/pages/playground/`).

**Every new plugin must be wired into the demo app.** The playground is the canonical integration reference; plugin reference pages come from `docs/plugins/<name>.md`.

When adding a new package, update:

1. `docs/plugins/<name>.md` — API reference (Starlight page with YAML frontmatter)
2. `apps/demo/package.json` — add `"@ailuracode/alpine-<name>": "workspace:*"` to `dependencies`
3. `apps/demo/tsconfig.json` — add a `paths` entry pointing to `../../packages/<name>/src/index.ts`
4. `apps/demo/astro.config.ts` — add Vite alias for the package
5. `apps/demo/src/entrypoint.ts` — import the plugin and call `Alpine.plugin(...)`
6. `apps/demo/src/plugin-nav.ts` — add sidebar nav entry for the playground
7. `apps/demo/src/components/demos/<Name>Demo.astro` — interactive demo section
8. `apps/demo/src/demo/playground-demos.ts` — register demo component for dynamic route
9. `apps/demo/src/pages/playground/[plugin].astro` — auto-generated subpage (no manual edit if demo is in registry)

Also update the package table in this file and root `README.md`.

## Do not

- Add more demo apps or Vite entry points unless requested
- Publish the private root package
- Introduce `@airluracode` typo (correct: `@ailuracode`)
- Couple plugins to a specific CSS framework
- Skip tests for plugin logic changes
- Ship a new plugin without adding it to the Astro demo app
- Manually edit version numbers for releases (use Changesets)

## References

- [Changesets](https://github.com/changesets/changesets)
