# @ailuracode/alpine-command

Headless command palette store for Alpine.js — searchable actions, keyboard navigation, nested pages, async execution, groups, aliases, and ARIA helpers. Compose optionally with overlay, scroll, and keyboard plugins.

**[Full documentation →](../../docs/plugins/command.md)**

## Install

```bash
pnpm add @ailuracode/alpine-command alpinejs
```

Active item navigation uses inline helpers — no extra dependency.

## Store API

```ts
$store.command.open();
$store.command.search = "theme";
const unregister = $store.command.register({
  id: "toggle-theme",
  label: "Toggle theme",
  group: "Appearance",
  shortcut: "⌘K",
  aliases: ["spotlight"],
  action: () => {},
});
$store.command.run("toggle-theme");
unregister();
```

## Highlights

- Configurable search ranking (`substring`, `fuzzy`, or custom `rank`)
- Dynamic `hidden`, `disabled`, and `enabled` predicates
- Disabled commands stay visible but are skipped by keyboard execution
- Nested pages via `pushPage()` / `goBack()`
- Async item/page loading and race-safe `run()` / `cancelRun()`
- Optional recent/pinned persistence hooks
- Optional scroll lock via `@ailuracode/alpine-scroll` while the palette is open
