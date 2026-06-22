# @ailuracode/alpine

Alpine.js plugin monorepo by **ailuracode**. Independent npm packages for common UI utilities — theme, viewport, connectivity, clipboard, scroll, touch detection, and web notifications.

## Packages

| Package | Type | Description |
|---------|------|-------------|
| [`@ailuracode/alpine-theme`](./packages/theme/README.md) | Store | Light / dark / system theme preference |
| [`@ailuracode/alpine-screen`](./packages/screen/README.md) | Store | Responsive device type and viewport width |
| [`@ailuracode/alpine-network`](./packages/network/README.md) | Magic | Network online / offline state |
| [`@ailuracode/alpine-clipboard`](./packages/clipboard/README.md) | Magic | Copy text to clipboard |
| [`@ailuracode/alpine-scroll`](./packages/scroll/README.md) | Store | Scroll position tracking and body lock |
| [`@ailuracode/alpine-touch`](./packages/touch/README.md) | Magic | Touch and pointer capabilities |
| [`@ailuracode/alpine-platform`](./packages/platform/README.md) | Magic | Client OS and platform detection |
| [`@ailuracode/alpine-notify`](./packages/notify/README.md) | Magic | Web Notifications API |

## Quick start

```bash
npm install @ailuracode/alpine-theme alpinejs
```

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpine-theme";

Alpine.plugin(theme({
  onChange({ resolved }) {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  },
}));

Alpine.start();
```

Install only the packages you need. Each one is a separate dependency.

## Example app

The [`example/`](./example/) directory contains an Astro + Alpine.js demo for all plugins. It is part of the pnpm workspace and is **not** published to npm.

```bash
pnpm install
pnpm run dev:example
```

## Documentation

- [Getting started](./docs/getting-started.md)
- [Architecture: stores vs magics](./docs/architecture.md)
- [Theme](./docs/theme.md)
- [Screen](./docs/screen.md)
- [Network](./docs/network.md)
- [Clipboard](./docs/clipboard.md)
- [Scroll](./docs/scroll.md)
- [Touch](./docs/touch.md)
- [Platform](./docs/platform.md)
- [Notify](./docs/notify.md)
- [Contributing](./docs/contributing.md)
- [AGENTS.md](./AGENTS.md) — guide for AI agents and maintainers

## Development

```bash
pnpm install
pnpm test              # all packages
pnpm run lint          # biome check (strict)
pnpm run lint:fix      # auto-fix
pnpm run test:coverage # coverage thresholds
pnpm run pack:check    # validate npm tarballs
pnpm run changeset     # after user-facing changes
```

## Versioning & release

Uses [Changesets](https://github.com/changesets/changesets) for independent package versions.

```bash
pnpm run changeset   # create a changeset
pnpm run version     # bump versions + changelogs
pnpm run release     # test + publish to npm
```

GitHub Actions versions packages on the **same PR branch** that contains pending changesets, then publishes to npm on `master` after merge when no changesets remain. Set the `NPM_TOKEN` repository secret for automated npm publish.

## Publishing (manual)

Requires npm 2FA and access to `@ailuracode`:

```bash
npm login
pnpm run release
```

Each package under `packages/*` has its own version, tests, and README.

## License

MIT
