---
title: "Detección de dispositivo"
description: "When to use $store.media and $platform — viewport, pointer, and OS signals."
---

Three plugins answer different “what device is this?” questions. Use the right one for each signal.

## Quick reference

| Question | Plugin | API |
|----------|--------|-----|
| Viewport width, height, breakpoint? | [`@ailuracode/alpine-media`](./plugins/media.md) | `$store.media.width`, `.breakpoint`, `.isMobile` |
| Touch, pointer, hover, orientation, reduced motion? | [`@ailuracode/alpine-media`](./plugins/media.md) | `$store.media.isTouch`, `.pointer`, `.hover`, … |
| macOS, Windows, iOS, Android? | [`@ailuracode/alpine-env`](./plugins/env.md) | `$platform.isMac`, `.isIos`, `.name` |

## `@ailuracode/alpine-media` — reactive environment

**Store:** `$store.media`

Covers everything that changes with **viewport** or **CSS media queries**:

- Breakpoints (`breakpoint`, `isMobile`, `isTablet`, `isDesktop`)
- Dimensions (`width`, `height`)
- Pointer and hover (`pointer`, `hover`, `isTouch`, `isCoarse`, `isFine`, `canHover`, `maxTouchPoints`)
- User/OS media preferences (`prefersReducedMotion`, `prefersContrast`, `prefersColorScheme`)
- Orientation (`orientation`)

```html
<nav x-show="$store.media.isMobile">Mobile nav</nav>
<button class="min-h-11" x-show="$store.media.isTouch">Large tap target</button>
<p x-show="!$store.media.canHover">No hover — use tap-friendly UI</p>
```

Install this for layout, responsive UI, and input-capability branching.

## `@ailuracode/alpine-env` — detección de plataforma

**Magic:** `$platform` (también `$network`, `$visibility`, `$battery`)

Static **OS detection** from `navigator` (UA, Client Hints). Does not listen to `matchMedia` or resize.

```html
<p x-show="$platform.isMac">Use ⌘+K</p>
<p x-show="$platform.isWindows">Use Ctrl+K</p>
<p x-show="$platform.isIos">Add to Home Screen for notifications</p>
```

Use for OS-specific copy, shortcuts, or install flows — not for layout width.

## Common combinations

```html
<!-- Responsive layout + touch-friendly controls -->
<div x-show="$store.media.isDesktop" class="grid grid-cols-3">...</div>
<div x-show="$store.media.isMobile" class="flex flex-col gap-4">...</div>

<!-- OS-specific shortcut hint on desktop -->
<p x-show="$store.media.isDesktop && $platform.isMac">Press ⌘S to save</p>
<p x-show="$store.media.isDesktop && $platform.isWindows">Press Ctrl+S to save</p>
```

## Related

- [Theme](./plugins/theme.md) — user-controlled light/dark (`$store.theme.resolved`), not device detection
- [`resolved` vs `prefersColorScheme`](./plugins/theme.md#resolved-vs-preferscolorscheme) — styling vs OS color signal
- [`@ailuracode/alpine-core`](./core.md) — `createMatchMediaWatcher`, `readTouchCapabilities` for custom plugins
