---
"@ailuracode/alpine-media": minor
---

Removed the breakpoint comparison helpers `is(name)`, `isMobile`, `isTablet`, and `isDesktop` from `$store.media`, the `$media` magic, and the `MediaController` surface. These were thin wrappers over `breakpoint === name` that were not reactive in Alpine bindings (the call delegated to the controller without touching the reactive proxy, so `x-bind:class` and `x-show` did not re-evaluate on resize). Compare against the reactive `breakpoint` field directly instead:

```html
<span x-show="$store.media.breakpoint === 'mobile'">Mobile nav</span>
<span x-show="$store.media.breakpoint === 'desktop'">Desktop nav</span>
```