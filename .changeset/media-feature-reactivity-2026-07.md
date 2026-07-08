---
"@ailuracode/alpine-media": patch
---

Fix a reactivity gap in `$store.media` where Alpine bindings for the feature getters (`pointer`, `hover`, `isTouch`, `isCoarse`, `canHover`, `prefersColorScheme`, …) failed to re-render when a media feature flipped without a viewport resize. The change-subscriber only mutated `width` / `height` / `breakpoint`, so a `(pointer: coarse)` change triggered by the Chrome DevTools device toolbar (or any OS-level media preference flip that does not change the window size) left the proxy unaware and the bindings rendered stale values. The store now bumps an internal `__revision` counter on every `change` event, and every feature getter reads it once to register a dependency. `width` / `height` / `breakpoint` still mirror through the controller. End-to-end test added in `packages/media/test/plugin.spec.ts` mounts a real Alpine `x-data` template and asserts the DOM updates on a matchMedia flip with no resize.
