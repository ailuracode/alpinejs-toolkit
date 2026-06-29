---
title: "Alpine.js Toolkit · @ailuracode"
description: "Toolkit modular para Alpine.js — init lazy, plugins headless y DX TypeScript moderna."
template: splash
hero:
  title: "Toolkit modular para Alpine.js"
  tagline: "Plugins headless con carga lazy para tema, layout, toasts y más — instala solo lo que necesitas, conecta tu propio markup y CSS."
  actions:
    - text: "Primeros pasos"
      link: "/getting-started/"
      icon: "right-arrow"
      variant: "primary"
    - text: "Abrir playground"
      link: "/playground/"
      icon: "external"
      variant: "minimal"
---

Toolkit modular para **Alpine.js** por ailuracode — agnóstico al framework, publicado en npm, listo para TypeScript.

## ¿Qué es esto?

**@ailuracode/alpinejs-toolkit** no es una colección aleatoria de plugins — es un **toolkit Alpine modular** basado en tres ideas:

| Pilar | Qué obtienes |
|-------|--------------|
| **Init lazy** | [`@ailuracode/alpine-core`](./core.md) registra plugins sin ejecutarlos al importar; carga bajo demanda con `import()` dinámico. |
| **Headless** | Solo stores y magics — sin CSS, sin componentes UI, sin suposiciones de Tailwind. Aplicas estilos con callbacks. |
| **DX moderna** | Globals TypeScript (`$store.theme`, `$toast`), paquetes npm tree-shakeables, loaders seguros para SSR. |

Empieza con **Esenciales** — los módulos que la mayoría de apps necesitan primero. Añade paquetes **Extendidos** y **Avanzados** solo cuando los requieras.

## Esenciales

| Paquete | API | Úsalo cuando |
|---------|-----|--------------|
| [Theme](./plugins/theme.md) | `$store.theme` | Preferencia claro / oscuro / sistema |
| [Media](./plugins/media.md) | `$store.media` | Breakpoints y media features en plantillas |
| [Scroll](./plugins/scroll.md) | `$store.scroll` | Progreso de scroll, body lock para overlays |
| [Sidebar](./plugins/sidebar.md) | `$store.sidebar` | Estado de drawer / nav shell |

## Headless UI

Solo estado y comportamiento — tú aportas markup y CSS.

| Paquete | API | Úsalo cuando |
|---------|-----|--------------|
| [Dialog](./plugins/dialog.md) | `$store.dialog` | Modales, focus trap, dismiss |
| [Menu](./plugins/menu.md) | `$store.menu` | Dropdowns y menús contextuales |
| [Tooltip](./plugins/tooltip.md) | `$store.tooltip` | Tooltips hover/focus |
| [Toast](./plugins/toast.md) | `$toast` | Mensajes in-app; [`fromPayload`](./plugins/toast.md) para objetos planos |
| [Tabs](./plugins/tabs.md) | `$store.tabs` | Pestañas con teclado |
| [Accordion](./plugins/accordion.md) | `$store.accordion` | Secciones expandibles |
| [Command](./plugins/command.md) | `$store.command` | Paleta de comandos |
| [Carousel](./plugins/carousel.md) | `$store.carousel` | Carruseles |

## Extendidos y avanzados

- **Extendidos** — [env](./plugins/env.md), [transfer](./plugins/transfer.md), [toggle](./plugins/toggle.md)
- **Avanzados** — [geo](./plugins/geo.md), [attention](./plugins/attention.md), [notify](./plugins/notify.md), [calendar](./plugins/calendar.md), [JSON:API](./plugins/json-api.md), [query kit](./plugins/query-kit.md)
- **Query** — [caché agnóstica al store](./query.md) con adaptadores opcionales y [devtools](./plugins/query-kit.md#devtools)

## Explorar

- [Primeros pasos](./getting-started.md) — instalar, init lazy, uso en HTML
- [Core](./core.md) — registro, init diferido, imports dinámicos
- [Playground](/playground/) — demos en vivo (Esenciales destacados)
