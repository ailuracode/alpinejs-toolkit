# AGENTS.md

Guidance for AI agents and contributors working on **@ailuracode/alpinejs-toolkit**.

## Project

Alpine.js plugin monorepo by **ailuracode**. 29 independent npm packages under `packages/`, plus shared tests and docs. The root package `@ailuracode/alpinejs-toolkit` is **private** and never published.

| Package | Type | Store / Magic |
|---------|------|---------------|
| `@ailuracode/alpine-core` | Core | Plugin registry (`registerPlugin`, `initPlugins`) |
| `@ailuracode/alpine-permissions` | Store | `$store.permissions` / `$permissions` — adapter registry |
| `@ailuracode/alpine-theme` | Store | `$store.theme` |
| `@ailuracode/alpine-media` | Store | `$store.media` |
| `@ailuracode/alpine-scroll` | Store | `$store.scroll` |
| `@ailuracode/alpine-sidebar` | Store | `$store.sidebar` |
| `@ailuracode/alpine-lang` | Store | `$store.lang` — headless `LangController` (singleton) + typed `change` event; `langPlugin` named export |
| `@ailuracode/alpine-overlay` | Store | `$store.overlay` — portal root, z-index stack, overlay registry |
| `@ailuracode/alpine-dialog` | Store | `$store.dialog` |
| `@ailuracode/alpine-menu` | Store | `$store.menu` |
| `@ailuracode/alpine-tooltip` | Store | `$store.tooltip` |
| `@ailuracode/alpine-tabs` | Store | `$store.tabs` |
| `@ailuracode/alpine-accordion` | Store | `$store.accordion` |
| `@ailuracode/alpine-command` | Store | `$store.command` |
| `@ailuracode/alpine-carousel` | Store | `$store.carousel` |
| `@ailuracode/alpine-env` | Magic | `$network`, `$visibility`, `$battery`, `$platform` |
| `@ailuracode/alpine-transfer` | Magic | `$clipboard`, `$share`, `$export` |
| `@ailuracode/alpine-toast` | Magic | `$toast` — headless queue (no markup/CSS) |
| `@ailuracode/alpine-calendar` | Magic | `$calendar` |
| `@ailuracode/alpine-toggle` | Magic | `$toggle` |
| `@ailuracode/alpine-child` | Directive | `x-child` |
| `@ailuracode/alpine-notify` | Magic | `$notify` |
| `@ailuracode/alpine-geo` | Store | `$store.geo` |
| `@ailuracode/alpine-attention` | Magic | `$wakelock`, `$idle` |
| `@ailuracode/alpine-query-kit` | Plugin | Query cache + Nanostores adapter + devtools (**recommended**) |
| `@ailuracode/alpine-query` | Core | Store-agnostic query cache (`createQueryClient`, `query({ adapter })`) |
| `@ailuracode/alpine-json-api` | Magic | `$jsonapi` — typed JSON:API client |
| `@ailuracode/alpine-query-adapter-alpine` | Plugin | Native `Alpine.reactive` adapter |
| `@ailuracode/alpine-query-adapter-zustand` | Plugin | Zustand vanilla adapter |

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
pnpm run pack:check   # pnpm pack dry-run for all publishable packages
pnpm run repo:check   # validate monorepo package catalog and wiring consistency
pnpm run repo:check:built # repo:check plus built export artifact validation
pnpm run architecture:check # enforce source-level architecture invariants
pnpm run changeset:check # verify pending changesets
pnpm run test:watch   # vitest watch mode
pnpm run changeset    # create a changeset after user-facing changes
pnpm run version      # apply changesets → bump package.json versions + CHANGELOGs
pnpm run release      # test + publish changed packages to npm
```

Do **not** bump `version` in `package.json` manually for releases — use Changesets.

Do **not** bump `version` in `package.json` manually for releases — use Changesets.

## Quick reference

### Stores vs magics

- **Store** — shared mutable state, actions, cross-component coordination (`theme`, `media`, `scroll`).
- **Magic** — read-only environment data or one-off utilities (`network`, `clipboard`).

### Naming

- npm scope: `@ailuracode/alpine-*`
- Author: `ailuracode` (not `airluracode`)
- Boolean derived state: **getters** — `$store.theme.isLight`, `$network.isOnline` (no `()` in templates)
- Actions: **methods** — `$store.theme.set('dark')`, `$store.scroll.lock()`
- Avoid React patterns: no `use*Store`, no hooks naming


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

### CSS policy

Plugins must stay **CSS-framework agnostic**. Do not hardcode `data-theme`, Tailwind `.dark`, or similar in plugin source. The consumer applies styles via callbacks (e.g. `theme({ onChange })`, `scroll({ onLockChange })`).

#### Development tooling exception (ALP-36)

Headless CSS rules apply to all `packages/**` **except** scoped development-tooling paths:

| Path | Package import | Notes |
|------|----------------|-------|
| `packages/query-kit/src/devtools/**` | `@ailuracode/alpine-query-kit/devtools` | Styled Query Devtools panel (development-only) |

Requirements:

- Main `@ailuracode/alpine-query-kit` entry MUST remain headless and MUST NOT statically import devtools UI.
- Devtools styles MUST use namespaced tokens (`--aq-*`) and classes (`aq-devtools-*`).
- Host theme detection (`data-theme`, `.dark`, `prefers-color-scheme`) is allowed only inside devtools paths.
- `repo:check` scans for styling markers outside exempt paths (`scripts/headless-css-policy.mjs`).
- `architecture:check` enforces controller boundaries, import visibility, dependency direction, constructor side effects, and test import policy (`scripts/architecture-check.mjs`).

See `.cursor/rules/devtools-tooling.mdc` for the full policy.

### Query cache (store-agnostic core)

The query engine is **agnostic to any store library**. Reactivity is injected via `QueryStateAdapter`:

- **`@ailuracode/alpine-query`** — cache core only (`QueryCache`, `createQueryClient`, `query({ adapter })`, `vanillaQueryAdapter`)
- **`@ailuracode/alpine-query-kit`** — **recommended** for Alpine; Nanostores adapter + re-exports `@ailuracode/alpine-query` (headless main entry)
- **`@ailuracode/alpine-query-kit/devtools`** — Query Devtools styled panel (development-only subpath)
- **`@ailuracode/alpine-query-adapter-alpine`** — native `Alpine.reactive`, zero external store deps
- **`@ailuracode/alpine-query-adapter-zustand`** — Zustand vanilla stores; no official zustand-alpine exists — manual `subscribe` → `Alpine.reactive` bridge
- **`createAlpineBridgedAdapter(Alpine, base)`** — shared bridge in core for adapter plugins
- **Devtools** — work with any adapter via the `QueryStore` surface

Do not couple `QueryCache` directly to Nanostores, Zustand, or Alpine.reactive — use adapter packages.

## Do not

- Add more demo apps or Vite entry points unless requested
- Publish the private root package
- Introduce `@airluracode` typo (correct: `@ailuracode`)
- Couple plugins to a specific CSS framework
- Skip tests for plugin logic changes
- Ship a new plugin without adding it to the Astro demo app
- Manually edit version numbers for releases (use Changesets)
- Run commands not explicitly requested (e.g. `git log` when only `git push` was asked)

## Cursor configuration

Project rules and skills follow the [Cursor](https://cursor.com) layout. This repo also follows the portable [AGENTS.md](https://agents.md) format for cross-agent compatibility.

### Rules (`.cursor/rules/`)

Rules are `.mdc` files with YAML frontmatter (`description`, `globs`, `alwaysApply`):

| Rule file | Scope | Key content |
|-----------|-------|-------------|
| `git-commit-message.mdc` | Always | PR descriptions, commit messages, Linear conventions |
| `branches.mdc` | Always | Branch naming convention for issue-driven work |
| `testing.mdc` | Test files | Harness selection, layer split, contract tests, common mistakes |
| `new-package.mdc` | Always | Package layout, plugin shape, public API, headless UI, CSS policy, errors, demo wiring |
| `formatting.mdc` | Always | Biome rules, TypeScript strict, SSR safety, prohibited/preferred patterns |
| `architecture.mdc` | Always | Import rules, structure, invariants, anti-patterns, reference packages |
| `alpine-integration.mdc` | Always | Store/directive registration, SSR safety, type augmentation |
| `mcp.mdc` | Always | Linear MCP usage |
| `bundle-budget.mdc` | Package JSON, vitest config | Size thresholds, enforcement, breaking rules |
| `coverage-thresholds.mdc` | Test files | 80% thresholds, per-package expectations |
| `tooling.mdc` | Package JSON, changeset | Version rules, changesets, CI checks |
| `tooling-configs.mdc` | Always | Config file locations, per-package files, CI files |
| `deprecation-policy.mdc` | Source files | Deprecation types, semver rules, migration pattern |
| `secrets-security.mdc` | Always | Hard rules, .gitignore, token handling |
| `i18n-messages.mdc` | Docs, demo, README | Message keys, locale files, multi-language docs |
| `devtools-tooling.mdc` | Query devtools source | Scoped styling exception for `@ailuracode/alpine-query-kit/devtools` |

### Skills (`.cursor/skills/`)

Project skills live in `.cursor/skills/<name>/SKILL.md`. Each skill has YAML frontmatter (`name`, `description`) and is loaded on demand for specialized workflows (scaffolding packages, changesets, Vitest, Astro, accessibility audits, etc.).

## References

- [Changesets](https://github.com/changesets/changesets)
- [AGENTS.md standard](https://agents.md)
