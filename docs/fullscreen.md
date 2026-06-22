# Fullscreen

Package: `@ailuracode/alpine-fullscreen`

Lightweight wrapper around the [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) via the `$fullscreen` magic. Works on any HTML element, handles unsupported browsers gracefully, and never throws.

## Install

```bash
npm install @ailuracode/alpine-fullscreen alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import fullscreen from "@ailuracode/alpine-fullscreen";

Alpine.plugin(fullscreen);
Alpine.start();
```

## Magic API

| Method | Type | Description |
|--------|------|-------------|
| `isSupported()` | `boolean` | `true` when the Fullscreen API is available and enabled |
| `isFullscreen()` | `boolean` | `true` when the document is in fullscreen mode |
| `element()` | `Element \| null` | The element currently in fullscreen |
| `enter(element?)` | `Promise<boolean>` | Request fullscreen; defaults to `document.documentElement` |
| `exit()` | `Promise<boolean>` | Exit fullscreen when active |
| `toggle(element?)` | `Promise<boolean>` | Enter or exit fullscreen |
| `onChange(callback)` | `() => void` | Subscribe to fullscreen changes; returns unsubscribe |
| `onError(callback)` | `() => void` | Subscribe to fullscreen errors; returns unsubscribe |

`onChange` receives `(fullscreen: boolean, element: Element | null)`.

## Usage examples

### Toggle fullscreen on the clicked element

```html
<div x-data>
  <button @click="$fullscreen.toggle($el)">
    Toggle Fullscreen
  </button>
</div>
```

### Fullscreen a video

```html
<div x-data>
  <video x-ref="video" src="clip.mp4" controls></video>
  <button @click="$fullscreen.enter($refs.video)">
    Fullscreen video
  </button>
</div>
```

### Fullscreen the page

```js
await $fullscreen.enter();
```

### Exit fullscreen

```js
await $fullscreen.exit();
```

### Conditional UI

```html
<button x-show="!$fullscreen.isFullscreen()" @click="$fullscreen.enter()">
  Enter fullscreen
</button>

<button x-show="$fullscreen.isFullscreen()" @click="$fullscreen.exit()">
  Exit fullscreen
</button>
```

### React to fullscreen changes

```html
<div
  x-data="{
    active: $fullscreen.isFullscreen(),
    init() {
      this.unsubscribe = $fullscreen.onChange((active) => {
        this.active = active;
      });
    },
    destroy() {
      this.unsubscribe?.();
    },
  }"
>
  <p x-text="active ? 'Fullscreen' : 'Windowed'"></p>
</div>
```

### Handle errors

```html
<div
  x-data="{
    message: '',
    init() {
      this.unsubscribe = $fullscreen.onError(() => {
        this.message = 'Fullscreen is not allowed here.';
      });
    },
    destroy() {
      this.unsubscribe?.();
    },
  }"
>
  <p x-show="message" x-text="message"></p>
</div>
```

### Feature detection

```html
<div x-show="!$fullscreen.isSupported()">
  Fullscreen is not supported in this browser.
</div>
```

## Behavior

- **Unsupported browsers** — `isSupported()` is `false`; async methods resolve to `false`.
- **Disabled API** — When `fullscreenEnabled` is `false`, operations resolve to `false`.
- **Default target** — `enter()` and `toggle()` use `document.documentElement` when no element is passed.
- **No throws** — Request, exit, and listener callbacks are wrapped; failures return `false` or are swallowed.
- **Automatic events** — The plugin listens for `fullscreenchange` and `fullscreenerror` (and vendor-prefixed equivalents) once at registration.
- **Multiple listeners** — `onChange` and `onError` support any number of subscribers; each returns an unsubscribe function.

The plugin does not add CSS classes or assume a UI framework. Style fullscreen layouts in your own CSS.

## Browser compatibility

| Environment | Notes |
|-------------|-------|
| Chrome, Edge, Opera | Full support |
| Firefox | Full support |
| Safari (desktop) | Supported with standard and `webkit` prefixed APIs |
| Safari (iOS / iPadOS) | Fullscreen is limited; video elements may use native fullscreen instead |
| iframe content | May require the `allowfullscreen` attribute on the iframe |
| HTTP (non-localhost) | Generally available; some embed policies still apply |

Always check `isSupported()` before showing fullscreen controls. User gesture requirements (e.g. click handlers) are enforced by the browser, not the plugin.

## TypeScript

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-fullscreen" />
```

Or import the plugin module:

```ts
import fullscreen from "@ailuracode/alpine-fullscreen";
```

Individual helpers are also exported for non-Alpine use:

```ts
import {
  createFullscreenMagic,
  enterFullscreen,
  exitFullscreen,
  isFullscreenSupported,
} from "@ailuracode/alpine-fullscreen";
```

## Design notes

- **Magic, not store** — Fullscreen is environment state with imperative enter/exit actions, similar to `$notify`.
- **Fail silent** — Returning `false` keeps Alpine event handlers simple (`@click="await $fullscreen.toggle($el)"`).
- **Vendor prefixes** — Detects standard, `webkit`, `moz`, and `ms` APIs for broader browser coverage.
- **Singleton listeners** — Document events are bound once; listener sets are shared across all `$fullscreen` usages.
- **CSS agnostic** — No framework-specific classes; consumers own presentation.
