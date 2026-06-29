---
title: "Alpine.js Toolkit · @ailuracode"
description: "Modular Alpine.js toolkit — lazy plugin init, headless stores and magics, modern TypeScript DX."
template: splash
hero:
  title: "Modular Alpine.js toolkit"
  tagline: "Lazy-loaded, headless plugins for theme, layout, toasts, and more — install only what you need, wire your own markup and CSS."
  actions:
    - text: "Getting started"
      link: "/getting-started/"
      icon: "right-arrow"
      variant: "primary"
    - text: "Open playground"
      link: "/playground/"
      icon: "external"
      variant: "minimal"
---

Modular toolkit for **Alpine.js** by ailuracode — framework-agnostic, npm-published, TypeScript-ready.

## What is this?

**@ailuracode/alpinejs-toolkit** is not a grab-bag of unrelated plugins — it is a **modular Alpine toolkit** built around three ideas:

| Pillar | What you get |
|--------|--------------|
| **Lazy init** | [`@ailuracode/alpine-core`](./core.md) registers plugins without running them at import time; load code on demand with dynamic `import()`. |
| **Headless** | Stores and magics only — no CSS, no UI components, no Tailwind assumptions. You apply styles via callbacks. |
| **Modern DX** | TypeScript globals (`$store.theme`, `$toast`), tree-shakeable npm packages, SSR-safe loaders. |

Start with **Essentials** — the modules most apps need first. Add **Extended** and **Advanced** packages only when you need them.

## Essentials

| Package | API | Use when |
|---------|-----|----------|
| [Theme](./plugins/theme.md) | `$store.theme` | Light / dark / system preference |
| [Media](./plugins/media.md) | `$store.media` | Viewport breakpoints and media features |
| [Scroll](./plugins/scroll.md) | `$store.scroll` | Scroll progress, body lock for overlays |
| [Sidebar](./plugins/sidebar.md) | `$store.sidebar` | Drawer / nav shell state |

## Headless UI

State and behavior only — you provide markup and CSS.

| Package | API | Use when |
|---------|-----|----------|
| [Dialog](./plugins/dialog.md) | `$store.dialog` | Modals, focus trap, dismiss |
| [Menu](./plugins/menu.md) | `$store.menu` | Dropdowns and context menus |
| [Tooltip](./plugins/tooltip.md) | `$store.tooltip` | Hover/focus tooltips |
| [Toast](./plugins/toast.md) | `$toast` | In-app messages; [`fromPayload`](./plugins/toast.md) for plain objects |
| [Tabs](./plugins/tabs.md) | `$store.tabs` | Tab panels with keyboard nav |
| [Accordion](./plugins/accordion.md) | `$store.accordion` | Expand/collapse sections |
| [Command](./plugins/command.md) | `$store.command` | Command palette / Spotlight |
| [Carousel](./plugins/carousel.md) | `$store.carousel` | Slideshows and carousels |

## Extended & advanced

- **Extended** — [env](./plugins/env.md), [transfer](./plugins/transfer.md), [toggle](./plugins/toggle.md)
- **Advanced** — [geo](./plugins/geo.md), [attention](./plugins/attention.md), [notify](./plugins/notify.md), [calendar](./plugins/calendar.md), [JSON:API](./plugins/json-api.md), [query kit](./plugins/query-kit.md)
- **Query** — [store-agnostic cache](./query.md) with pluggable adapters and optional [devtools](./plugins/query-kit.md#devtools)

## Explore

- [Getting started](./getting-started.md) — install, lazy init, use in HTML
- [Core](./core.md) — registry, deferred initialization, dynamic imports
- [Playground](/playground/) — live demos (Essentials highlighted)
