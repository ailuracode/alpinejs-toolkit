---
"@ailuracode/alpine-menu": minor
"@ailuracode/alpine-dialog": minor
"@ailuracode/alpine-tooltip": minor
"@ailuracode/alpine-carousel": minor
"@ailuracode/alpine-accordion": minor
---

Encapsulate mutable state in headless UI controllers (`menu`, `dialog`, `tooltip`, `carousel`, `accordion`).

### Migration

- Controllers no longer expose live mutable `instances` registries. Use `hasInstance(id)`, query methods (`isOpen`, `current`, …), or `snapshotInstances()` for readonly copies.
- `MenuController` no longer accepts an external `instances` record in its constructor or command methods.
- `Controller.toStore()` was removed. Use `createMenuStore()`, `createDialogStore()`, `createTooltipStore()`, or `createCarouselStore()` — or the new `create*StoreFromController()` helpers when wiring a custom adapter.
- Alpine plugins now mirror controller snapshots into `$store.*.instances` through typed `change` events. Template bindings on `$store.*.instances[id]` continue to work; direct mutation of store snapshots does not change controller state.
- README and `docs/plugins/*` pages document architecture, standalone usage, and migration for all four packages.
- **Accordion** — fixes Alpine reactivity in the playground demo by syncing cloned group snapshots into `$store.accordion.groups` (same adapter pattern as the other controllers).

### Standalone usage

```ts
const controller = createMenuController();
controller.register("demo");
controller.open("demo");

const snapshot = controller.snapshotInstances();
snapshot.demo.open = false; // does not affect the controller
expect(controller.isOpen("demo")).toBe(true);
```
