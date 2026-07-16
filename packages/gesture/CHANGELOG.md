# @ailuracode/alpine-gesture

## 1.0.0

### Patch Changes

- Updated dependencies [9b88155]
- Updated dependencies [9b88155]
  - @ailuracode/alpine-core@0.3.0

## 0.1.1

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 0.1.0

### Minor Changes

- b345a56: Add pinch zoom demo, E2E coverage, directive integration test, and documentation for the two-pointer zoom pattern. Allow `x-gesture` without an inline handler when consumers listen via `@tap` or `addEventListener`. Add `mouseButtons` filtering (default primary button only) and expose `button`, `buttons`, and `pointerType` on gesture events and store state.

### Patch Changes

- 9a44380: `@ailuracode/alpine-gesture` now exposes `storeKey`, `magicKey`, and `directiveKey` on `GestureOptions` so hosts with pre-existing `$store.gesture`, `$gesture`, or `x-gesture` collisions can move every integration surface (`store` + magic + directive) without forking the controller. `magicKey` follows `storeKey` by default, and `directiveKey` is independent so the markup can change without retuning the store. The new `DEFAULT_GESTURE_STORE_KEY` / `DEFAULT_GESTURE_MAGIC_KEY` / `DEFAULT_GESTURE_DIRECTIVE_KEY` constants keep the renames discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` (store + magic) and `bridgeControllerDirective` (the `x-gesture` directive) with `packageName: "gesture"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `gesturePlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-gesture` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
- Updated dependencies [3c8b40f]
- Updated dependencies [1ae869c]
- Updated dependencies [ade9bc7]
- Updated dependencies [556055a]
- Updated dependencies [a488cbb]
- Updated dependencies [aa88539]
- Updated dependencies [173379d]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1

## 0.1.0

### Minor Changes

- Initial release: headless gesture recognition for Alpine.js. Recognises tap, doubletap, longpress, swipe, pan, and pinch via pointer events. Includes `GestureController`, Alpine plugin (`$store.gesture`, `$gesture` magic, `x-gesture` directive), competing gesture cancellation, axis locking, configurable thresholds, SSR safety, passive listeners, and pointer capture.
