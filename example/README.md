# Alpine.js plugins — docs & playground

[Starlight](https://starlight.astro.build/) documentation site plus an interactive Alpine.js playground for all `@ailuracode/alpine-*` packages. Part of the pnpm workspace (`example/`). **Private** — not published to npm.

## Run locally

From the repo root:

```bash
pnpm install
pnpm run dev:example
```

Or from this directory:

```bash
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321) for documentation. Interactive demos:

- [/playground/](http://localhost:4321/playground/) — catalog overview
- [/playground/theme/](http://localhost:4321/playground/theme/) — one demo per plugin

## Architecture

| Path | Purpose |
|------|---------|
| `../docs/` | **Source of truth** for Markdown reference (edit here) |
| `../docs/es/`, `../docs/pt/` | Translated guides and plugin reference — edit these `.md` files directly (Spanish, Portuguese) |
| `../docs/i18n/` | Splash hero JSON (`index-*.json`) + plugin sidebar labels (`plugin-labels.json`) |
| `scripts/sync-docs.mjs` | Syncs `docs/` → `src/content/docs/` (en root, es/, pt/) with Starlight frontmatter |
| `src/content/docs/` | Starlight content (generated guides + `index.md`) |
| `src/pages/playground/` | Overview + `[plugin].astro` subpages |
| `src/playground-demos.ts` | Demo component registry |

`pnpm dev` and `pnpm build` run `sync:docs` automatically.

## Build

```bash
pnpm run build
pnpm run preview
```

## Alpine playground

The playground loads Alpine manually from `BaseLayout.astro` (not `@astrojs/alpinejs`).

1. **Root `x-data`** on `<body>` — Alpine only walks the DOM from `x-data` roots.
2. **Register plugins before `Alpine.start()`** — see `src/entrypoint.ts`.

Plugins are registered in `src/entrypoint.ts`. Demo sections live under `src/components/demos/`.
