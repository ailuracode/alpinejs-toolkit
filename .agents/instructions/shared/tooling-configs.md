---
description: 'Per-package vitest / tsconfig / vite+ shape rules for @ailuracode/alpinejs-toolkit.'
---

# Tooling Configs

Per-package tooling files MUST follow the shape documented here. `scripts/tooling-configs-check.ts` enforces the structural rules. Format and lint rules live in the root `vite.config.ts` and apply uniformly (no per-package overrides).

## `tsconfig.json` (extends `../../tsconfig.json`)

Mandatory:

```jsonc
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "rootDir": "./src",
        "outDir": "./dist",
        "types": ["alpinejs"],
    },
    "include": ["src/**/*.ts", "src/**/*.d.ts"],
    "exclude": ["node_modules", "dist", "test", "coverage"],
}
```

Forbidden overrides:

- `strict: false` or any strict-family flag (`noImplicitAny`, `strictNullChecks`, ...) disabled.
- `target` lower than `ES2022`.
- `module` / `moduleResolution` set to anything other than what the base configures (`ES2022` / `Bundler`). Test-specific overrides go in `tsconfig.test.json`.
- `isolatedModules: false`.

`types` is mandatory because Alpine augumentation is needed for global types. To add `node` types (test files only) use `tsconfig.test.json`.

## `tsconfig.test.json` (extends `./tsconfig.json` or `../../tsconfig.test.json`)

```jsonc
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "noEmit": true,
        "allowImportingTsExtensions": true,
        "types": ["alpinejs", "node"],
    },
    "include": ["src/**/*.ts", "src/**/*.d.ts", "test/**/*.ts"],
}
```

The `noEmit: true` override is mandatory — `tsc` runs tests via Vitest, never emits. The convention accepts either extending the per-package base (`./tsconfig.json`, which transitively pulls the root) or extending the root shared test base (`../../tsconfig.test.json`). Pick one and be consistent within the package.

## `vitest.config.ts` (per-package)

```ts
import { defineProject } from 'vitest/config';

export default defineProject({
    test: {
        globals: true,
        environment: 'jsdom', // or 'node' — see below
        include: ['test/**/*.{test,spec}.ts'],
        setupFiles: ['./test/setup.ts'], // omit if not needed
    },
});
```

Environment choices:

- `'jsdom'` — required if the package imports or stubs `window`, `document`, `matchMedia`, `IntersectionObserver`, `ResizeObserver`, `Notification`, or runs DOM-coupled controllers.
- `'node'` — permitted ONLY for packages whose src has no DOM access and whose tests do not need DOM.

A package that uses Alpine MUST use `'jsdom'`. There are no exceptions.

`globals: true` is mandatory (see `./testing.md`). The `setupFiles` entry is optional; include it only when matchMedia/fetch/ResizeObserver stubs are needed.

## Vite+ format and lint (root config)

Format and lint rules live in the **root** `vite.config.ts`, in the `fmt` and `lint` blocks (powered by Vite+, Oxfmt, Oxlint). Per-package overrides are NOT permitted — uniformity wins. To change a rule, update the root `vite.config.ts`.

```ts
// vite.config.ts (root)
import { defineConfig } from 'vite-plus';

export default defineConfig({
    fmt: {
        printWidth: 100,
        tabWidth: 4,
        useTabs: false,
        semi: true,
        singleQuote: true,
        ignorePatterns: ['resources/views/mail/*', '.agents/templates/**'],
    },
    lint: {
        plugins: ['unicorn', 'typescript', 'oxc'],
        ignorePatterns: [
            '**/node_modules/**',
            '**/dist/**',
            '**/coverage/**',
            '**/vendor/**',
            '.agents/templates/**',
        ],
    },
});
```

Use the CLI:

```bash
vp fmt                     # format everything (default path)
vp fmt --check .           # CI check
vp lint scripts/ packages/ # lint first-party code
vp check .                 # format + lint + type-check
```

For per-file checks the editor config should point at `./vite.config.ts` so format-on-save uses the same `fmt` block (set `oxc.fmt.configPath` in `.vscode/settings.json`).

If a rule must be disabled for a specific file, use a top-level `// oxlint-disable-next-line` (or `// oxfmt-ignore-start` / `// oxfmt-ignore-end`) and add a short reason. Bare disables without a reason fail review.

## `dist/` hygiene

`bun run build` (which calls `tsc`) MUST produce:

```
packages/<name>/dist/
├── index.js
├── index.d.ts
├── index.js.map
├── index.d.ts.map
├── global.d.ts           # copied by postbuild step
├── types.d.ts
├── types.js
└── internal/
    └── ...
```

Forbidden inside `dist/`:

- `node_modules/`
- `test/` or any test source
- `coverage/`
- `*.tsbuildinfo`
- `.gitkeep` or other VCS-only files
- Pre-bundle artifacts (the `.vite/` directory)

The `files` array in `package.json` MUST include only `dist` and `README.md`:

```jsonc
{
    "files": ["dist", "README.md"],
}
```

## Coverage shape (per-package, declared in root `vitest.config.ts`)

Coverage config is **declared at the workspace root** and inherited by every package via `vitest.workspace.ts`. Each package sets only its `include`:

```ts
// in vitest.workspace.ts (root)
export default ['packages/*/vitest.config.ts'];
```

Coverage thresholds live in the root `vitest.config.ts` and are enforced globally — see `.agents/instructions/shared/coverage-thresholds.md`.

## Path aliases

Path aliases inside `packages/` are **PROHIBITED**. Consumers import via `@ailuracode/alpine-<name>` only. If a cross-package relative import feels tempting, that is a signal the package boundary is wrong — split the package or accept the dep.

The `tsconfig.json` `paths` field is forbidden.

## Shared setup

MatchMedia, `fetch`, and `ResizeObserver` stubs are exposed by `@ailuracode/alpine-core` (use `safeMatchMedia()`, `safeDocument()`, `isBrowser()`). Packages MUST NOT re-implement these stubs in their own `test/setup.ts`. If your tests need a stub that core does not provide, add it to core and reference it from your package.
