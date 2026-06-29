---
title: "Accordion"
description: "Package: @ailuracode/alpine-accordion"
---

Package: `@ailuracode/alpine-accordion`

Headless accordion store with **single** or **multiple** open panels, optional **default open** items, keyboard focus management, and ARIA helpers.

## Install

```bash
npm install @ailuracode/alpine-accordion alpinejs
```

## Store API

| Method | Description |
|--------|-------------|
| `register(accordionId, options?)` | Create a group (`mode`, `defaultOpen`, `onChange`) |
| `registerItem(accordionId, itemId, disabled?)` | Register a panel trigger |
| `open(accordionId, itemId)` / `close` / `toggle` | Panel visibility |
| `isOpen(accordionId, itemId)` | Whether a panel is expanded |
| `openIds(accordionId)` | Array of currently open item ids |
| `activeItem(accordionId)` | Focused trigger id |
| `handleKeydown(accordionId, event)` | `ArrowUp`/`ArrowDown`/`Home`/`End` |
| `triggerProps(accordionId, itemId)` | `aria-expanded`, `aria-controls`, `tabindex` |
| `panelProps(accordionId, itemId)` | `role`, `aria-labelledby`, `aria-hidden` |

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `mode` | `'single'` | `'single'` closes other panels when one opens; `'multiple'` allows several open |
| `defaultOpen` | — | Item id or array of ids open after `registerItem` |
| `onChange` | — | `(openIds: string[]) => void` when open state changes |

In **single** mode, only the **first** id in `defaultOpen` is used when an array is passed.

## Single mode

Only one panel open at a time.

```js
$store.accordion.register("faq", { mode: "single" });
["item-1", "item-2"].forEach((id) => $store.accordion.registerItem("faq", id));
```

```html
<div
  x-data
  x-init="
    $store.accordion.register('faq', { mode: 'single' });
    ['item-1','item-2'].forEach(id => $store.accordion.registerItem('faq', id));
  "
  @keydown="$store.accordion.handleKeydown('faq', $event)"
>
  <template x-for="id in ['item-1','item-2']" :key="id">
    <div>
      <button
        x-bind="$store.accordion.triggerProps('faq', id)"
        @click="$store.accordion.toggle('faq', id)"
        x-text="id"
      ></button>
      <div
        class="overflow-hidden"
        x-show="$store.accordion.isOpen('faq', id)"
        x-collapse
        x-bind="$store.accordion.panelProps('faq', id)"
      >
        <p class="px-4 py-3">Answer for <span x-text="id"></span></p>
      </div>
    </div>
  </template>
</div>
```

## Multiple mode

Several panels can stay open.

```js
$store.accordion.register("settings", { mode: "multiple" });
["notifications", "privacy"].forEach((id) => $store.accordion.registerItem("settings", id));
```

```html
<div
  x-init="
    $store.accordion.register('settings', { mode: 'multiple' });
    ['notifications','privacy'].forEach(id => $store.accordion.registerItem('settings', id));
  "
>
  <!-- same markup as single mode -->
</div>
```

## Default open

Pass `defaultOpen` when registering. Panels open automatically when their item is registered.

```js
// Single — one panel open on init
$store.accordion.register("faq", {
  mode: "single",
  defaultOpen: "item-2",
});

// Multiple — several panels open on init
$store.accordion.register("settings", {
  mode: "multiple",
  defaultOpen: ["notifications", "integrations"],
});

["item-1", "item-2", "item-3"].forEach((id) => $store.accordion.registerItem("faq", id));
```

Read open ids reactively:

```html
<span x-text="$store.accordion.openIds('faq').join(', ')"></span>
```

## Panel animation

`@ailuracode/alpine-accordion` is headless — it does not animate panels. Use the official [`@alpinejs/collapse`](https://alpinejs.dev/plugins/collapse) plugin: `x-collapse` must sit on the **same element** as `x-show`.

```bash
npm install @alpinejs/collapse
```

```js
import collapse from "@alpinejs/collapse";

Alpine.plugin(collapse);
```

```html
<div
  x-show="$store.accordion.isOpen('faq', id)"
  x-collapse
  x-bind="$store.accordion.panelProps('faq', id)"
  class="overflow-hidden"
>
  <div class="px-4 py-3">Panel content</div>
</div>
```

Put padding on an **inner** wrapper — vertical padding on the same node as `x-collapse` prevents height from reaching `0` and the close animation can appear stuck.

Optional modifiers: `x-collapse.duration.300ms`, `x-collapse.min.50px`. See the [Collapse plugin docs](https://alpinejs.dev/plugins/collapse).

`panelProps()` does not set `hidden` — visibility is driven by `x-show` on the client.

## SSR

Safe when panels start collapsed; visibility is controlled with `x-show` on the client. Use `defaultOpen` only when markup is hydrated on the client.
