# AGENTS.md

Guidance for AI agents and contributors working on **@ailuracode/alpine**.

## Project

Alpine.js plugin monorepo by **ailuracode**. Nine independent npm packages under `packages/`, plus shared tests and docs. The root package `@ailuracode/alpine` is **private** and never published.

| Package | Type | Store / Magic |
|---------|------|---------------|
| `@ailuracode/alpine-theme` | Store | `$store.theme` |
| `@ailuracode/alpine-screen` | Store | `$store.device` |
| `@ailuracode/alpine-scroll` | Store | `$store.scroll` |
| `@ailuracode/alpine-network` | Magic | `$network` |
| `@ailuracode/alpine-battery` | Magic | `$battery` |
| `@ailuracode/alpine-clipboard` | Magic | `$clipboard` |
| `@ailuracode/alpine-touch` | Magic | `$touch` |
| `@ailuracode/alpine-platform` | Magic | `$platform` |
| `@ailuracode/alpine-notify` | Magic | `$notify` |

## Repository layout

```
packages/<name>/src/index.ts   # plugin source (TypeScript)
packages/<name>/dist/            # compiled output published to npm
packages/<name>/test/            # Vitest tests
packages/<name>/README.md        # npm package readme
docs/                            # full documentation
test/                            # shared test setup (setup.ts, helpers.ts, mock-alpine.ts)
.changeset/                      # versioning changesets
.github/workflows/               # CI + release automation
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

Plugins must stay **CSS-framework agnostic**. Do not hardcode `data-theme`, Tailwind `.dark`, or similar in plugin source. The consumer applies styles via callbacks (e.g. `theme({ onChange })`) or app CSS (e.g. `.scroll-locked` for scroll lock).

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

## Testing

- Framework: Vitest + happy-dom
- Include pattern: `packages/*/test/**/*.test.ts`
- Store plugins: use `startAlpine()` from `test/helpers.ts`
- Magic plugins: use `createMagicHarness()` from `test/mock-alpine.ts`
- `matchMedia`: use `setMatchMedia()` from `test/setup.ts`

Every change to plugin behavior must include or update tests. Run `pnpm test` and `pnpm run lint` before finishing.

## Linting & formatting

[Biome](https://biomejs.dev/) with strict rules (`biome.json`):

```bash
pnpm run lint       # check only (CI)
pnpm run lint:fix   # auto-fix safe issues
pnpm run format     # format all files
```

## Versioning (Changesets)

1. After a user-facing change, run `pnpm run changeset`.
2. Select affected package(s) and semver bump (`patch`, `minor`, `major`).
3. Write a short changelog summary (English).
4. On merge to `master`, the **Release** workflow publishes to npm when no pending changesets remain (version bumps land on the PR branch before merge).

Packages are versioned **independently**. One changeset can touch multiple packages.

**New packages:** set `"version": "0.0.0"` in `package.json`. A `minor` changeset then produces the first publishable version (`0.1.0`). Do **not** start at `0.1.0` with a `minor` changeset — Changesets will bump to `0.2.0` before the first npm release.

## Publishing

- Registry: npm, scope `@ailuracode`, public access
- Requires npm 2FA or granular token with publish permission
- GitHub secret: `NPM_TOKEN` for automated publish
- Manual: `npm login` then `pnpm run release`

## Documentation

When changing public API or behavior, update:

1. `docs/<package>.md`
2. `packages/<name>/README.md`
3. Root `README.md` if the package list or workflow changes

All docs in **English**.

## Example app

`example/` is the Astro demo app in the pnpm workspace. It is **private** and excluded from publish and changesets. Run it with `pnpm run dev:example` from the repo root.

## Do not

- Add more demo apps or Vite entry points unless requested
- Publish the private root package
- Introduce `@airluracode` typo (correct: `@ailuracode`)
- Couple plugins to a specific CSS framework
- Skip tests for plugin logic changes
- Manually edit version numbers for releases (use Changesets)

## References

- [Architecture](docs/architecture.md)
- [Contributing](docs/contributing.md)
- [Changesets](https://github.com/changesets/changesets)
