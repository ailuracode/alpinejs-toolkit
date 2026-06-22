# Visibility

Package: `@ailuracode/alpine-visibility`

Reactive tab visibility via the `$visibility` magic. Wraps the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) (`document.visibilityState`, `visibilitychange`).

## Install

```bash
npm install @ailuracode/alpine-visibility alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import visibility from "@ailuracode/alpine-visibility";

Alpine.plugin(visibility);
Alpine.start();
```

## Magic API

| Property | Type | Description |
|----------|------|-------------|
| `isVisible` | `boolean` | `true` when the tab is visible |
| `state` | `"visible" \| "hidden" \| "prerender"` | Raw `document.visibilityState` |

## HTML examples

```html
<div x-show="!$visibility.isVisible" class="background-banner">
  This tab is in the background
</div>

<span
  :class="$visibility.isVisible ? 'dot-active' : 'dot-idle'"
  x-text="$visibility.isVisible ? 'Active tab' : 'Background tab'"
></span>

<div x-show="$visibility.state === 'hidden'">
  Pause animations or polling while hidden
</div>
```

## Notes

- Fires when the user switches tabs, minimizes the window, or locks the screen
- Use `isVisible` for boolean checks; use `state` when you need the raw visibility value
- Read-only — no store, no persistence
