# Contributing

## Repository structure

```
packages/
  theme/       @ailuracode/alpine-theme
  screen/      @ailuracode/alpine-screen
  network/     @ailuracode/alpine-network
  clipboard/   @ailuracode/alpine-clipboard
  scroll/      @ailuracode/alpine-scroll
  touch/       @ailuracode/alpine-touch
  platform/    @ailuracode/alpine-platform
test/          shared Vitest setup and helpers
docs/          documentation
```

Each package contains:

- `src/index.js` — plugin source
- `test/` — package tests
- `README.md` — package overview
- `package.json` — independent npm manifest

## Setup

```bash
pnpm install
```

## CI checks

| Job | Command | When |
|-----|---------|------|
| Lint | `pnpm run lint` | every push / PR |
| Test | `pnpm test` | Node 22 |
| Coverage | `pnpm run test:coverage` | Node 22 (≥80% lines, ≥70% functions) |
| Pack | `pnpm run pack:check` | validates npm tarballs |
| Audit | `pnpm audit --audit-level critical` | blocks on critical CVEs |
| Changeset | `pnpm run changeset:check` | PRs only — requires changeset when `packages/*` changes |

Dependabot opens weekly PRs for pnpm and GitHub Actions updates.

## Running tests

```bash
pnpm test                    # all tests
pnpm run test:coverage       # with coverage thresholds
pnpm run lint                # biome check (strict)
pnpm run lint:fix            # auto-fix
pnpm run pack:check          # validate publish tarballs
pnpm run changeset:check origin/master
```

Tests use [Vitest](https://vitest.dev/) with [happy-dom](https://github.com/capricorn86/happy-dom).

### Test helpers

- `test/setup.js` — `matchMedia` mock, `localStorage` reset, DOM cleanup
- `test/helpers.js` — `startAlpine(...plugins)` for store integration tests
- `test/mock-alpine.js` — minimal Alpine mock for magic-only plugins

## Conventions

### Stores vs magics

See [Architecture](./architecture.md). Prefer stores for shared mutable state; magics for read-only environment data or utilities.

### Naming

- Package scope: `@ailuracode/alpine-*`
- Boolean getters: `isLight`, `isOnline`, `isLocked` (no `()` in templates)
- Methods for actions: `set()`, `lock()`, `cycle()`
- Avoid React patterns (`use*Store`, hooks)

### CSS

Plugins must stay CSS-framework agnostic. DOM styling belongs in the consumer app (via callbacks like `theme.onChange` or app-level CSS for `.scroll-locked`).

## Adding a new package

1. Create `packages/my-feature/` with `src/index.js`, `package.json`, `test/`, `README.md`
2. Add `"name": "@ailuracode/alpine-my-feature"` with `peerDependencies.alpinejs`
3. Add docs in `docs/my-feature.md` and link from root README
4. Ensure `pnpm test` passes

## Versioning

This repo uses [Changesets](https://github.com/changesets/changesets) for independent package versioning.

### Add a changeset

After a user-facing change:

```bash
pnpm run changeset
```

Select package(s), semver bump (`patch` / `minor` / `major`), and write a short summary in English.

### Automated release (GitHub)

1. Merge changesets to `master`.
2. The **Release** workflow applies pending changesets on the same branch (bumps versions + generates CHANGELOGs) and pushes the commit back.
3. When `master` has no pending changesets, changed packages publish to npm automatically.

Requires a repository secret:

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm granular token with publish access to `@ailuracode` |

### Manual release

```bash
pnpm run version   # apply pending changesets
pnpm run release   # test + publish to npm
```

Do not bump `version` in `package.json` manually for releases.

## Publishing (manual)

```bash
npm login
pnpm run release
```

Requires npm 2FA or a granular access token with publish permissions.

## License

MIT — see package `package.json` files.
