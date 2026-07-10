---
name: new-package
description: 'Scaffold a new package under packages/ for the @ailuracode/alpinejs-toolkit monorepo, following AGENTS.md. Use when: creating a new package, adding a feature to the toolkit, scaffolding a component/service/utility/adapter/preset.'
---

# Scaffold a new package

Step-by-step workflow for adding a new package to
`@ailuracode/alpinejs-toolkit` while honoring every rule in
[AGENTS.md](../../../AGENTS.md).

## When to use

- Creating a new feature, service, utility, adapter, or preset under
  `packages/`.
- Onboarding a teammate who is publishing their first toolkit package.

## Inputs to gather

- Package name (folder name `<name>`, published as
  `@ailuracode/alpine-<name>`).
- Category: `Service`, `Component`, `Utility`, `Adapter`, or `Preset`.
- Whether it depends on `@ailuracode/alpine-core` (always, except core
  itself).
- Optional external dependency and how it is encapsulated.

## Workflow

1. **Identify the category.** Confirm the classification in
   [.cursor/rules/architecture.mdc](../../rules/architecture.mdc).
2. **Read core contracts.** Open `@ailuracode/alpine-core` to confirm
   `BaseController`, `ToolkitError`, `isBrowser`, `safeWindow`, etc.
3. **Read a sibling package.** Mirror an existing controller, plugin,
   structure, and test layout that is closest in category.
4. **Define the public API.** Decide `Options`, `State`, `Events`, `Error`,
   `Controller`, and `Plugin` names. Identify breaking-change risks.
5. **Scaffold the package layout.**

    ```text
    packages/<name>/
    ├── src/
    │   ├── index.ts
    │   ├── controller.ts
    │   ├── plugin.ts
    │   ├── types.ts
    │   ├── events.ts
    │   ├── options.ts
    │   ├── alpine/{directives,store,magic,bindings}.ts
    │   ├── internal/
    │   └── global.d.ts
    ├── test/
    │   ├── controller.test.ts
    │   ├── plugin.test.ts
    │   ├── lifecycle.test.ts
    │   └── accessibility.test.ts
    ├── package.json
    └── README.md
    ```

6. **Implement in this order** (per the _Mandatory agent flow_ in
   [AGENTS.md](../../../AGENTS.md)):
    1. Headless controller.
    2. Controller tests.
    3. Alpine integration.
    4. Integration tests.
    5. Cleanup.
    6. SSR safety check.
    7. Docs + demo.
    8. Changeset (`patch` / `minor` / `major`).
7. **Register the package** in `pnpm-workspace.yaml`, `apps/demo/package.json`,
   and `apps/demo/tsconfig.json` paths.
8. **Run the closing checks** before opening a PR:

    ```bash
    pnpm run typecheck
    pnpm run lint
    pnpm test
    pnpm run test:coverage
    pnpm run build
    pnpm run pack:check
    pnpm run changeset:check
    ```

## Anti-patterns to refuse

- All logic in `index.ts`.
- Global store for a local component.
- Browser access during import or in the constructor.
- Listeners without cleanup.
- Public events dispatched outside `$dispatch`.
- `any`, deep class hierarchies, mutable public state.
- Reimplementing a chosen external dependency inside the adapter.
- Opinionated CSS or mandatory markup.
- Skipping tests, docs, or the changeset.

## Output

A PR that lands a complete package, all checks green, and a changeset
describing the consumer-observable change.
