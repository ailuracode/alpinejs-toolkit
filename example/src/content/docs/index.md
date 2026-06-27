---
title: "Alpine.js + @ailuracode"
description: "Documentation and interactive demos for headless Alpine.js plugins by ailuracode."
template: splash
hero:
  title: "Alpine.js plugins, documented"
  tagline: "Headless stores and magics for theme, scroll, query cache, toasts, and more — framework-agnostic, npm-published, and ready for your markup."
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

Documentation and interactive demos for headless Alpine.js plugins by ailuracode.

## What is this?

**@ailuracode/alpine** is a monorepo of independent Alpine.js plugins. Each package ships as `@ailuracode/alpine-<name>` on npm.

| Type | Examples | Use when |
|------|----------|----------|
| **Store** | `$store.theme`, `$store.scroll` | Shared mutable state and actions across components |
| **Magic** | `$network`, `$toast`, `$clipboard` | Environment data or one-off utilities |
| **Core** | `createQueryClient`, `query({ adapter })` | Store-agnostic infrastructure |

Plugins never ship CSS or framework-specific markup — you wire styles through callbacks and your own components.

## Explore

- [Getting started](./getting-started.md) — install, register plugins, use in HTML
- [Playground](/playground/) — live interactive demos for every plugin
- [Plugins](./theme.md) — per-package API reference (sidebar)
