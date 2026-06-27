# Alpine.js plugins — docs & playground

[Starlight](https://starlight.astro.build/) documentation site plus an interactive Alpine.js playground for all `@ailuracode/alpine-*` packages. Part of the pnpm workspace (`apps/demo/`). **Private** — not published to npm.

## Run locally

From the repo root:

```bash
pnpm install
pnpm run dev:demo
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
| `../../docs/` | **Source of truth** — Starlight Markdown (YAML frontmatter, no sync step) |
| `../../docs/plugins/` | Plugin API reference (English) |
| `../../docs/es/`, `../../docs/pt/` | Translated guides + `plugins/` reference |
| `src/content/docs/` | Symlink → `../../../../docs` (Starlight content collection) |
| `src/pages/playground/` | Overview + `[plugin].astro` subpages |
| `src/demo/` | Alpine demo registrations + playground component registry |
| `src/demo/playground-demos.ts` | Maps plugin id → Astro demo component |

Edit `docs/` directly; `pnpm dev` and `pnpm build` read it through the symlink.

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
