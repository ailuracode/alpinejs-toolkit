# AGENTS.md

Guidance for AI agents and contributors working on **@ailuracode/alpinejs-toolkit**.

## ⛔ MANDATORY: Tool Selection (HARD RULE)

**BEFORE typing ANY terminal command, you MUST do this:**

1. Check if `rtk` supports the command you need
2. If yes → use `rtk <command>` — **NO EXCEPTIONS**
3. If no → THEN you may use raw commands

**BANNED patterns** (never write these):
- `git ...` → use `rtk git ...`
- `gh ...` → use `rtk gh ...`
- `pnpm ...` → use `rtk pnpm ...`
- `npm ...` → use `rtk pnpm ...`

**Self-check before every bash call:** "Am I about to type a raw CLI command? STOP. Use rtk."

Fallback is ONLY for behaviors `rtk` doesn't support. When unsure, try `rtk` first.

## Project

Alpine.js plugin monorepo by **ailuracode**. Twenty-six independent npm packages under `packages/`, plus shared tests and docs. The root package `@ailuracode/alpinejs-toolkit` is **private** and never published.

| Package | Type | Store / Magic |
|---------|------|---------------|
| `@ailuracode/alpine-core` | Core | Plugin registry (`registerPlugin`, `initPlugins`) |
| `@ailuracode/alpine-theme` | Store | `$store.theme` |
| `@ailuracode/alpine-media` | Store | `$store.media` |
| `@ailuracode/alpine-scroll` | Store | `$store.scroll` |
| `@ailuracode/alpine-sidebar` | Store | `$store.sidebar` |
| `@ailuracode/alpine-lang` | Store | `$store.lang` — headless `LangController` (singleton) + typed `change` event; `langPlugin` named export |
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

For terminal workflows, USE `rtk` instead of raw `git`, `gh`, `pnpm`, test, and log commands whenever `rtk` supports that command. Fall back to raw commands only when `rtk` does not support needed behavior. Keep using structured tools like `Read`, `Grep`, and `Glob` for file/context access.

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

### Query cache (store-agnostic core)

The query engine is **agnostic to any store library**. Reactivity is injected via `QueryStateAdapter`:

- **`@ailuracode/alpine-query`** — cache core only (`QueryCache`, `createQueryClient`, `query({ adapter })`, `vanillaQueryAdapter`)
- **`@ailuracode/alpine-query-kit`** — **recommended** for Alpine; Nanostores adapter + devtools + re-exports `@ailuracode/alpine-query`
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

## Rules (`.agents/rules/`)

Canonical rules live in `.agents/rules/` as `.mdc` files with YAML frontmatter. Each file is scoped by `globs` and `alwaysApply`:

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
| `readme-standardization.mdc` | Package README | Install commands, imports, API documentation tiers, verification checklist |

`.cursor/rules/` provides Cursor-specific overrides (`testing.mdc` globs-scoped, `git-commit-message.mdc` + `new-package.mdc` always-apply).

## References

- [Changesets](https://github.com/changesets/changesets)
- [AGENTS.md standard](https://agents.md)
