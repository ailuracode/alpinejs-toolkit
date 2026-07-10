# @ailuracode/alpine-command

Headless command palette store for Alpine.js — searchable actions, keyboard navigation, groups, and shortcuts. Compose optionally with dialog and toast plugins.

**[Full documentation →](../../docs/plugins/command.md)**

## Install

```bash
pnpm add @ailuracode/alpine-command alpinejs
```

## Store API

```ts
$store.command.open();
$store.command.search = "theme";
$store.command.register({
  id: "toggle-theme",
  label: "Toggle theme",
  group: "Appearance",
  shortcut: "⌘K",
  action: () => {},
});
$store.command.run("toggle-theme");
```
