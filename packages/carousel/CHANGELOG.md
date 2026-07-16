# @ailuracode/alpine-carousel

## 1.1.1

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 1.1.0

### Minor Changes

- e221bbf: Encapsulate mutable state in headless UI controllers (`menu`, `dialog`, `tooltip`, `carousel`, `accordion`).

  ### Migration

  - Controllers no longer expose live mutable `instances` registries. Use `hasInstance(id)`, query methods (`isOpen`, `current`, …), or `snapshotInstances()` for readonly copies.
  - `MenuController` no longer accepts an external `instances` record in its constructor or command methods.
  - `Controller.toStore()` was removed. Use `createMenuStore()`, `createDialogStore()`, `createTooltipStore()`, or `createCarouselStore()` — or the new `create*StoreFromController()` helpers when wiring a custom adapter.
  - Alpine plugins now mirror controller snapshots into `$store.*.instances` through typed `change` events. Template bindings on `$store.*.instances[id]` continue to work; direct mutation of store snapshots does not change controller state.
  - README and `docs/plugins/*` pages document architecture, standalone usage, and migration for all four packages.
  - **Accordion** — fixes Alpine reactivity in the playground demo by syncing cloned group snapshots into `$store.accordion.groups` (same adapter pattern as the other controllers).
  - **Carousel** — fixes indicator dots and reactive `count()` / `current()` in the playground by reading through the reactive `$store.carousel.instances` mirror.

  ### Standalone usage

  ```ts
  const controller = createMenuController();
  controller.register("demo");
  controller.open("demo");

  const snapshot = controller.snapshotInstances();
  snapshot.demo.open = false; // does not affect the controller
  expect(controller.isOpen("demo")).toBe(true);
  ```

### Patch Changes

- 3c8b40f: Extend the shared Alpine lifecycle bridge with `syncRecordFromSnapshot` and migrate instance-registry store adapters (`dialog`, `menu`, `tooltip`, `carousel`, `virtual`, `selection`, `overlay`) to `bridgeControllerStore` with explicit subscription teardown on cleanup.
- 666ade3: Hide Embla implementation types from the public API.

  ### Migration

  - Removed `$store.carousel.instance(id)` and `CarouselController.instance(id)`. Use semantic methods instead: `goTo(id, index)`, `next(id)`, `previous(id)`, `play(id)`, `pause(id)`, and readonly snapshot fields on `$store.carousel.instances[id]`.
  - `CarouselInstance` snapshots no longer expose `embla`, `autoplay`, or `viewport`. Engine handles stay private to `CarouselController`.
  - `CarouselOptions.align` and `CarouselOptions.containScroll` now use toolkit-owned `CarouselAlign` and `CarouselContainScroll` types instead of re-exporting Embla option types.

- 2511f89: Declare `"sideEffects": false` on publishable packages that were missing the metadata, and enforce the policy in `repo:check` and `pack:check`.
- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-carousel` `CreateCarouselOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.carousel` collision can move the integration surface without forking the controller. The new `DEFAULT_CAROUSEL_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "carousel"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `carouselPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-carousel` from the `registrationGuardPending` migration list tracked by `architecture:check`.
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

## 1.0.0

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.0

### Minor Changes

- Add headless UI plugins: `x-child` directive plus dialog, menu, tooltip, tabs, accordion, command, and carousel stores.
