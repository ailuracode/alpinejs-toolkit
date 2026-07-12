# @ailuracode/alpine-tabs

Headless accessible tabs store for Alpine.js — selection, keyboard navigation, ARIA helpers, and optional URL query sync.

**[Full documentation →](../../docs/plugins/tabs.md)**

## Install

```bash
pnpm add @ailuracode/alpine-tabs @ailuracode/alpine-core @ailuracode/alpine-selection alpinejs
```

Active tab tracking is backed by `@ailuracode/alpine-selection` (single mode).

## Store API

```ts
$store.tabs.select("settings-tabs", "profile");
$store.tabs.active("settings-tabs");
$store.tabs.isActive("settings-tabs", "profile");
$store.tabs.next("settings-tabs");
```
