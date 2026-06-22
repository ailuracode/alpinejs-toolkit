# AGENTS.md

Guidance for AI agents and contributors working on **@ailuracode/alpine**.

## Project

Alpine.js plugin monorepo by **ailuracode**. Six independent npm packages under `packages/`, plus shared tests and docs. The root package `@ailuracode/alpine` is **private** and never published.

| Package | Type | Store / Magic |
|---------|------|---------------|
| `@ailuracode/alpine-theme` | Store | `$store.theme` |
| `@ailuracode/alpine-screen` | Store | `$store.device` |
| `@ailuracode/alpine-scroll` | Store | `$store.scroll` |
| `@ailuracode/alpine-online` | Magic | `$online` |
| `@ailuracode/alpine-clipboard` | Magic | `$clipboard` |
| `@ailuracode/alpine-touch` | Magic | `$touch` |

## Repository layout

```
packages/<name>/src/index.js   # plugin entry (default export)
packages/<name>/test/            # Vitest tests
packages/<name>/README.md        # npm package readme
docs/                            # full documentation
test/                            # shared test setup (setup.js, helpers.js, mock-alpine.js)
.changeset/                      # versioning changesets
.github/workflows/               # CI + release automation
```

## Commands

```bash
npm install          # install all workspaces
npm test             # run full test suite (required before release)
npm run test:watch   # vitest watch mode
npm run changeset    # create a changeset after user-facing changes
npm run version      # apply changesets → bump package.json versions + CHANGELOGs
npm run release      # test + publish changed packages to npm
```

Do **not** bump `version` in `package.json` manually for releases — use Changesets.

## Code conventions

### Stores vs magics

- **Store** — shared mutable state, actions, cross-component coordination (`theme`, `screen`, `scroll`).
- **Magic** — read-only environment data or one-off utilities (`online`, `touch`, `clipboard`).

### Naming

- npm scope: `@ailuracode/alpine-*`
- Author: `ailuracode` (not `airluracode`)
- Boolean derived state: **getters** — `$store.theme.isLight`, `$online.isOnline` (no `()` in templates)
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
- Include pattern: `packages/*/test/**/*.test.js`
- Store plugins: use `startAlpine()` from `test/helpers.js`
- Magic plugins: use `createMagicHarness()` from `test/mock-alpine.js`
- `matchMedia`: use `setMatchMedia()` from `test/setup.js`

Every change to plugin behavior must include or update tests. Run `npm test` before finishing.

## Versioning (Changesets)

1. After a user-facing change, run `npm run changeset`.
2. Select affected package(s) and semver bump (`patch`, `minor`, `major`).
3. Write a short changelog summary (English).
4. On merge to `master`, the **Release** workflow opens a "Version Packages" PR or publishes to npm.

Packages are versioned **independently**. One changeset can touch multiple packages.

## Publishing

- Registry: npm, scope `@ailuracode`, public access
- Requires npm 2FA or granular token with publish permission
- GitHub secret: `NPM_TOKEN` for automated publish
- Manual: `npm login` then `npm run release`

## Documentation

When changing public API or behavior, update:

1. `docs/<package>.md`
2. `packages/<name>/README.md`
3. Root `README.md` if the package list or workflow changes

All docs in **English**.

## Do not

- Add demo apps or Vite entry points to this repo unless requested
- Publish the private root package
- Introduce `@airluracode` typo (correct: `@ailuracode`)
- Couple plugins to a specific CSS framework
- Skip tests for plugin logic changes
- Manually edit version numbers for releases (use Changesets)

## References

- [Architecture](docs/architecture.md)
- [Contributing](docs/contributing.md)
- [Changesets](https://github.com/changesets/changesets)
