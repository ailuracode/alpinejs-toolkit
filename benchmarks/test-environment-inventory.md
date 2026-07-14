# Test environment inventory

Classification for [ALP-130](https://linear.app/ailuracode/issue/ALP-130/classify-tests-by-node-simulated-dom-and-real-browser-responsibility) under epic [ALP-127](https://linear.app/ailuracode/issue/ALP-127/epic-optimize-vitest-performance-and-test-environment-layering).

## Summary

- Generated: 2026-07-14T23:15:52.520Z
- Vitest files: 227
- Playwright E2E files: 29

### Target environment (Vitest + E2E)

| Environment | Files | Role |
| --- | ---: | --- |
| `node` | 135 | Controller, cache, parsing, SSR import, repository checks |
| `happy-dom` | 92 | Alpine stores, directives, simulated DOM integration tests, and package overlay projects |
| `playwright` | 29 | Real browser focus, layout, keyboard, permissions |

### Responsibility layer

| Layer | Files |
| --- | ---: |
| `controller` | 18 |
| `contract` | 20 |
| `integration` | 32 |
| `accessibility` | 6 |
| `utility` | 148 |
| `repository` | 3 |
| `e2e` | 29 |

## Layer conventions

| Layer | Filename pattern | Harness | Target environment |
| --- | --- | --- | --- |
| Controller | `controller.test.ts`, `controller.spec.ts` | Direct module imports | `node` |
| Contract | `contract.*`, `encapsulation.*`, `ssr.*` | Package entrypoint or built surface | `node` (SSR) or DOM when validating browser helpers |
| Integration | `plugin.*`, `alpine.integration.*`, `adapter.*`, `magic.*` | `startAlpine()` or real Alpine | `happy-dom` |
| Accessibility | `accessibility.*`, `a11y.*` | Controller or Alpine + DOM assertions | `node` when metadata-only; DOM when focus/roles are asserted |
| Utility | `parse.*`, `utils.*`, adapter unit tests | Direct modules | `node` |
| Repository | `test/architecture-check.test.ts`, etc. | Node scripts | `node` |
| E2E | `packages/<pkg>/e2e/*.spec.ts` | Playwright fixtures | `playwright` |

## Regenerate

```bash
pnpm run test:classify
```

Machine-readable output: `benchmarks/test-environment-inventory.json`.

## Per-package overlap (Vitest vs Playwright)

| Package | Vitest | E2E | Overlap | Note |
| --- | ---: | ---: | --- | --- |
| `accordion` | 3 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `attention` | 2 | 1 | complementary | Browser behavior validated in Playwright; Vitest covers controller/contract layers. |
| `calendar` | 3 | 0 | review | Simulated DOM integration without Playwright — confirm critical browser behavior is not missing from E2E backlog. |
| `carousel` | 3 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `child` | 2 | 1 | complementary | Browser behavior validated in Playwright; Vitest covers controller/contract layers. |
| `collection` | 9 | 0 | none | Vitest only — no Playwright project. |
| `command` | 7 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `core` | 13 | 1 | complementary | Browser behavior validated in Playwright; Vitest covers controller/contract layers. |
| `dialog` | 4 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `env` | 4 | 1 | complementary | Browser behavior validated in Playwright; Vitest covers controller/contract layers. |
| `form` | 9 | 0 | review | Simulated DOM integration without Playwright — confirm critical browser behavior is not missing from E2E backlog. |
| `geo` | 2 | 1 | complementary | Browser behavior validated in Playwright; Vitest covers controller/contract layers. |
| `gesture` | 7 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `history` | 2 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `json-api` | 4 | 0 | review | Simulated DOM integration without Playwright — confirm critical browser behavior is not missing from E2E backlog. |
| `keyboard` | 5 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `lang` | 4 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `media` | 2 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `menu` | 4 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `notify` | 2 | 1 | complementary | Browser behavior validated in Playwright; Vitest covers controller/contract layers. |
| `overlay` | 12 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `permissions` | 3 | 1 | complementary | Browser behavior validated in Playwright; Vitest covers controller/contract layers. |
| `query` | 11 | 0 | review | Simulated DOM integration without Playwright — confirm critical browser behavior is not missing from E2E backlog. |
| `query-adapter-alpine` | 2 | 0 | review | Simulated DOM integration without Playwright — confirm critical browser behavior is not missing from E2E backlog. |
| `query-adapter-zustand` | 1 | 0 | review | Simulated DOM integration without Playwright — confirm critical browser behavior is not missing from E2E backlog. |
| `query-kit` | 16 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `realtime` | 9 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `scroll` | 11 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `selection` | 14 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `sidebar` | 5 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `tabs` | 1 | 1 | complementary | Browser behavior validated in Playwright; Vitest covers controller/contract layers. |
| `theme` | 7 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `toast` | 3 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `toggle` | 2 | 0 | review | Simulated DOM integration without Playwright — confirm critical browser behavior is not missing from E2E backlog. |
| `tooltip` | 4 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |
| `transfer` | 5 | 1 | complementary | Browser behavior validated in Playwright; Vitest covers controller/contract layers. |
| `ui` | 3 | 0 | none | Vitest only — no Playwright project. |
| `virtual` | 8 | 1 | complementary | DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice. |

## Full file inventory

| File | Package | Layer | Target environment | Source |
| --- | --- | --- | --- | --- |
| `apps/demo/test/catalog.test.ts` | `demo` | `utility` | `node` | content |
| `apps/demo/test/combined-docs-loader.test.ts` | `demo` | `utility` | `node` | content |
| `apps/demo/test/docs-navigation.test.ts` | `demo` | `utility` | `node` | content |
| `apps/demo/test/docs-translations.test.ts` | `demo` | `utility` | `node` | content |
| `apps/demo/test/locale-detect.test.ts` | `demo` | `utility` | `node` | content |
| `apps/demo/test/playground-navigation.test.ts` | `demo` | `utility` | `node` | content |
| `packages/accordion/e2e/accordion.e2e.spec.ts` | `accordion` | `e2e` | `playwright` | path |
| `packages/accordion/test/accordion.test.ts` | `accordion` | `utility` | `happy-dom` | content |
| `packages/accordion/test/alpine.reactivity.test.ts` | `accordion` | `integration` | `happy-dom` | content |
| `packages/accordion/test/encapsulation.test.ts` | `accordion` | `contract` | `node` | content |
| `packages/attention/e2e/attention.e2e.spec.ts` | `attention` | `e2e` | `playwright` | path |
| `packages/attention/test/attention.test.ts` | `attention` | `utility` | `node` | content |
| `packages/attention/test/permission-adapter.test.ts` | `attention` | `utility` | `node` | content |
| `packages/calendar/test/alpine-integration.spec.ts` | `calendar` | `integration` | `happy-dom` | filename |
| `packages/calendar/test/controller.spec.ts` | `calendar` | `controller` | `node` | filename |
| `packages/calendar/test/selection.test.ts` | `calendar` | `utility` | `node` | content |
| `packages/carousel/e2e/carousel.e2e.spec.ts` | `carousel` | `e2e` | `playwright` | path |
| `packages/carousel/test/alpine.reactivity.test.ts` | `carousel` | `integration` | `happy-dom` | content |
| `packages/carousel/test/carousel.test.ts` | `carousel` | `utility` | `happy-dom` | content |
| `packages/carousel/test/encapsulation.test.ts` | `carousel` | `contract` | `happy-dom` | content |
| `packages/child/e2e/child.e2e.spec.ts` | `child` | `e2e` | `playwright` | path |
| `packages/child/test/child.test.ts` | `child` | `utility` | `happy-dom` | content |
| `packages/child/test/sidebar.integration.test.ts` | `child` | `utility` | `happy-dom` | content |
| `packages/collection/test/composition.spec.ts` | `collection` | `utility` | `node` | content |
| `packages/collection/test/controller.spec.ts` | `collection` | `controller` | `node` | filename |
| `packages/collection/test/events.spec.ts` | `collection` | `utility` | `node` | content |
| `packages/collection/test/filter.spec.ts` | `collection` | `utility` | `node` | content |
| `packages/collection/test/group.spec.ts` | `collection` | `utility` | `node` | content |
| `packages/collection/test/navigation.spec.ts` | `collection` | `utility` | `node` | content |
| `packages/collection/test/paginate.spec.ts` | `collection` | `utility` | `node` | content |
| `packages/collection/test/sort.spec.ts` | `collection` | `utility` | `node` | content |
| `packages/collection/test/ssr.spec.ts` | `collection` | `contract` | `node` | filename |
| `packages/command/e2e/command.e2e.spec.ts` | `command` | `e2e` | `playwright` | path |
| `packages/command/test/accessibility.test.ts` | `command` | `accessibility` | `node` | content |
| `packages/command/test/alpine-reactivity.test.ts` | `command` | `integration` | `happy-dom` | content |
| `packages/command/test/command.test.ts` | `command` | `utility` | `happy-dom` | content |
| `packages/command/test/contract.test.ts` | `command` | `contract` | `node` | content |
| `packages/command/test/controller.test.ts` | `command` | `controller` | `node` | filename |
| `packages/command/test/demo-markup.test.ts` | `command` | `integration` | `happy-dom` | content |
| `packages/command/test/search.test.ts` | `command` | `utility` | `node` | content |
| `packages/core/e2e/core.e2e.spec.ts` | `core` | `e2e` | `playwright` | path |
| `packages/core/test/alpine-types.spec.ts` | `core` | `utility` | `node` | filename |
| `packages/core/test/base-controller.spec.ts` | `core` | `controller` | `node` | filename |
| `packages/core/test/contract.spec.ts` | `core` | `contract` | `node` | content |
| `packages/core/test/controller-id.spec.ts` | `core` | `controller` | `node` | filename |
| `packages/core/test/core-primitives.spec.ts` | `core` | `utility` | `node` | content |
| `packages/core/test/init.spec.ts` | `core` | `utility` | `node` | filename |
| `packages/core/test/lazy-plugin.spec.ts` | `core` | `utility` | `node` | filename |
| `packages/core/test/lifecycle-bridge.spec.ts` | `core` | `utility` | `node` | content |
| `packages/core/test/load-error.spec.ts` | `core` | `utility` | `node` | filename |
| `packages/core/test/loader.spec.ts` | `core` | `utility` | `node` | filename |
| `packages/core/test/match-media.spec.ts` | `core` | `utility` | `node` | content |
| `packages/core/test/plugin-registry.spec.ts` | `core` | `utility` | `node` | filename |
| `packages/core/test/singleton.spec.ts` | `core` | `utility` | `node` | content |
| `packages/dialog/e2e/dialog.e2e.spec.ts` | `dialog` | `e2e` | `playwright` | path |
| `packages/dialog/test/alpine.integration.test.ts` | `dialog` | `integration` | `happy-dom` | content |
| `packages/dialog/test/alpine.teleport.integration.test.ts` | `dialog` | `utility` | `happy-dom` | content |
| `packages/dialog/test/dialog.test.ts` | `dialog` | `utility` | `happy-dom` | content |
| `packages/dialog/test/encapsulation.test.ts` | `dialog` | `contract` | `node` | content |
| `packages/env/e2e/env.e2e.spec.ts` | `env` | `e2e` | `playwright` | path |
| `packages/env/test/controller.test.ts` | `env` | `controller` | `node` | filename |
| `packages/env/test/env.test.ts` | `env` | `utility` | `node` | content |
| `packages/env/test/platform.test.ts` | `env` | `utility` | `node` | content |
| `packages/env/test/visibility.test.ts` | `env` | `utility` | `node` | content |
| `packages/form/test/accessibility.test.ts` | `form` | `accessibility` | `node` | content |
| `packages/form/test/async-races.test.ts` | `form` | `utility` | `node` | content |
| `packages/form/test/controller.test.ts` | `form` | `controller` | `node` | filename |
| `packages/form/test/create-form.test.ts` | `form` | `utility` | `node` | content |
| `packages/form/test/json-api-errors.test.ts` | `form` | `utility` | `node` | content |
| `packages/form/test/paths.test.ts` | `form` | `utility` | `node` | content |
| `packages/form/test/plugin.test.ts` | `form` | `integration` | `happy-dom` | content |
| `packages/form/test/ssr.test.ts` | `form` | `contract` | `node` | filename |
| `packages/form/test/standard-schema.test.ts` | `form` | `utility` | `node` | content |
| `packages/geo/e2e/geo.e2e.spec.ts` | `geo` | `e2e` | `playwright` | path |
| `packages/geo/test/geo.test.ts` | `geo` | `utility` | `happy-dom` | content |
| `packages/geo/test/permission-adapter.test.ts` | `geo` | `utility` | `node` | content |
| `packages/gesture/e2e/gesture.smoke.spec.ts` | `gesture` | `e2e` | `playwright` | path |
| `packages/gesture/test/controller.test.ts` | `gesture` | `controller` | `happy-dom` | content |
| `packages/gesture/test/directive.integration.test.ts` | `gesture` | `integration` | `happy-dom` | content |
| `packages/gesture/test/error.test.ts` | `gesture` | `utility` | `node` | content |
| `packages/gesture/test/options.test.ts` | `gesture` | `utility` | `node` | content |
| `packages/gesture/test/plugin.test.ts` | `gesture` | `integration` | `happy-dom` | content |
| `packages/gesture/test/pointer.test.ts` | `gesture` | `utility` | `node` | content |
| `packages/gesture/test/recognizer.test.ts` | `gesture` | `utility` | `node` | content |
| `packages/history/e2e/history.e2e.spec.ts` | `history` | `e2e` | `playwright` | path |
| `packages/history/test/controller.test.ts` | `history` | `controller` | `node` | filename |
| `packages/history/test/plugin.test.ts` | `history` | `integration` | `happy-dom` | content |
| `packages/json-api/test/json-api.test.ts` | `json-api` | `utility` | `node` | content |
| `packages/json-api/test/plugin.test.ts` | `json-api` | `integration` | `happy-dom` | filename |
| `packages/json-api/test/query.test.ts` | `json-api` | `utility` | `node` | content |
| `packages/json-api/test/resolve.test.ts` | `json-api` | `utility` | `node` | content |
| `packages/keyboard/e2e/keyboard.e2e.spec.ts` | `keyboard` | `e2e` | `playwright` | path |
| `packages/keyboard/test/accessibility.test.ts` | `keyboard` | `accessibility` | `node` | content |
| `packages/keyboard/test/contract.test.ts` | `keyboard` | `contract` | `happy-dom` | content |
| `packages/keyboard/test/controller.test.ts` | `keyboard` | `controller` | `happy-dom` | content |
| `packages/keyboard/test/integration.test.ts` | `keyboard` | `utility` | `happy-dom` | content |
| `packages/keyboard/test/parse.test.ts` | `keyboard` | `utility` | `node` | content |
| `packages/lang/e2e/lang.e2e.spec.ts` | `lang` | `e2e` | `playwright` | path |
| `packages/lang/test/helpers.test.ts` | `lang` | `utility` | `node` | content |
| `packages/lang/test/manager.test.ts` | `lang` | `utility` | `node` | content |
| `packages/lang/test/plugin.test.ts` | `lang` | `integration` | `happy-dom` | content |
| `packages/lang/test/types.test.ts` | `lang` | `utility` | `node` | content |
| `packages/media/e2e/media.e2e.spec.ts` | `media` | `e2e` | `playwright` | path |
| `packages/media/test/controller.spec.ts` | `media` | `controller` | `node` | filename |
| `packages/media/test/plugin.spec.ts` | `media` | `integration` | `happy-dom` | filename |
| `packages/menu/e2e/menu.e2e.spec.ts` | `menu` | `e2e` | `playwright` | path |
| `packages/menu/test/alpine.integration.test.ts` | `menu` | `integration` | `happy-dom` | content |
| `packages/menu/test/alpine.teleport.integration.test.ts` | `menu` | `utility` | `happy-dom` | content |
| `packages/menu/test/encapsulation.test.ts` | `menu` | `contract` | `node` | content |
| `packages/menu/test/menu.test.ts` | `menu` | `utility` | `happy-dom` | content |
| `packages/notify/e2e/notify.e2e.spec.ts` | `notify` | `e2e` | `playwright` | path |
| `packages/notify/test/notify.test.ts` | `notify` | `utility` | `node` | content |
| `packages/notify/test/permission-adapter.test.ts` | `notify` | `utility` | `node` | content |
| `packages/overlay/e2e/overlay.e2e.spec.ts` | `overlay` | `e2e` | `playwright` | path |
| `packages/overlay/test/configure.test.ts` | `overlay` | `utility` | `happy-dom` | content |
| `packages/overlay/test/controller.test.ts` | `overlay` | `controller` | `happy-dom` | content |
| `packages/overlay/test/events.test.ts` | `overlay` | `utility` | `happy-dom` | content |
| `packages/overlay/test/magic.test.ts` | `overlay` | `integration` | `happy-dom` | content |
| `packages/overlay/test/plugin.test.ts` | `overlay` | `integration` | `happy-dom` | content |
| `packages/overlay/test/portal-helper.test.ts` | `overlay` | `utility` | `happy-dom` | content |
| `packages/overlay/test/portal-root.test.ts` | `overlay` | `utility` | `happy-dom` | content |
| `packages/overlay/test/queries.test.ts` | `overlay` | `utility` | `happy-dom` | content |
| `packages/overlay/test/register-unregister.test.ts` | `overlay` | `utility` | `happy-dom` | content |
| `packages/overlay/test/soft-peer.test.ts` | `overlay` | `utility` | `happy-dom` | content |
| `packages/overlay/test/ssr.test.ts` | `overlay` | `contract` | `node` | filename |
| `packages/overlay/test/stack-order.test.ts` | `overlay` | `utility` | `happy-dom` | content |
| `packages/permissions/e2e/permissions.e2e.spec.ts` | `permissions` | `e2e` | `playwright` | path |
| `packages/permissions/test/contract.test.ts` | `permissions` | `contract` | `happy-dom` | content |
| `packages/permissions/test/controller.test.ts` | `permissions` | `controller` | `node` | filename |
| `packages/permissions/test/snapshot.test.ts` | `permissions` | `utility` | `node` | content |
| `packages/query-adapter-alpine/test/adapter.test.ts` | `query-adapter-alpine` | `integration` | `happy-dom` | content |
| `packages/query-adapter-alpine/test/bridge.test.ts` | `query-adapter-alpine` | `utility` | `happy-dom` | content |
| `packages/query-adapter-zustand/test/adapter.test.ts` | `query-adapter-zustand` | `integration` | `happy-dom` | filename |
| `packages/query-kit/e2e/query-kit.e2e.spec.ts` | `query-kit` | `e2e` | `playwright` | path |
| `packages/query-kit/test/adapter-badge.test.ts` | `query-kit` | `utility` | `node` | content |
| `packages/query-kit/test/adapter.test.ts` | `query-kit` | `integration` | `happy-dom` | filename |
| `packages/query-kit/test/devtools.test.ts` | `query-kit` | `integration` | `happy-dom` | content |
| `packages/query-kit/test/format-duration.test.ts` | `query-kit` | `utility` | `node` | content |
| `packages/query-kit/test/format-key.test.ts` | `query-kit` | `utility` | `node` | content |
| `packages/query-kit/test/json-tree.test.ts` | `query-kit` | `utility` | `node` | content |
| `packages/query-kit/test/kit-with-devtools.test.ts` | `query-kit` | `utility` | `happy-dom` | content |
| `packages/query-kit/test/merge-stores.test.ts` | `query-kit` | `utility` | `happy-dom` | content |
| `packages/query-kit/test/panel-preferences.test.ts` | `query-kit` | `utility` | `happy-dom` | content |
| `packages/query-kit/test/panel-resize.test.ts` | `query-kit` | `utility` | `happy-dom` | content |
| `packages/query-kit/test/query-kit.test.ts` | `query-kit` | `utility` | `happy-dom` | content |
| `packages/query-kit/test/responsive-layout.test.ts` | `query-kit` | `utility` | `happy-dom` | content |
| `packages/query-kit/test/sort.test.ts` | `query-kit` | `utility` | `node` | content |
| `packages/query-kit/test/style-utils.test.ts` | `query-kit` | `utility` | `happy-dom` | content |
| `packages/query-kit/test/theme.test.ts` | `query-kit` | `utility` | `happy-dom` | content |
| `packages/query-kit/test/toggle-corner.test.ts` | `query-kit` | `utility` | `happy-dom` | content |
| `packages/query/test/adapters.test.ts` | `query` | `utility` | `node` | content |
| `packages/query/test/cache-coverage.test.ts` | `query` | `utility` | `node` | content |
| `packages/query/test/client.test.ts` | `query` | `utility` | `node` | content |
| `packages/query/test/devtools.test.ts` | `query` | `integration` | `happy-dom` | content |
| `packages/query/test/entry-removal.test.ts` | `query` | `utility` | `node` | content |
| `packages/query/test/fetch.test.ts` | `query` | `utility` | `node` | content |
| `packages/query/test/inference.test.ts` | `query` | `utility` | `node` | content |
| `packages/query/test/lifecycle.test.ts` | `query` | `utility` | `node` | content |
| `packages/query/test/observer.test.ts` | `query` | `utility` | `node` | content |
| `packages/query/test/query.test.ts` | `query` | `utility` | `happy-dom` | content |
| `packages/query/test/utils.test.ts` | `query` | `utility` | `node` | content |
| `packages/realtime/e2e/realtime.e2e.spec.ts` | `realtime` | `e2e` | `playwright` | path |
| `packages/realtime/test/adapters/SseTransportAdapter.test.ts` | `realtime` | `utility` | `node` | content |
| `packages/realtime/test/adapters/TransportAdapterFactory.test.ts` | `realtime` | `utility` | `node` | content |
| `packages/realtime/test/adapters/WsTransportAdapter.test.ts` | `realtime` | `utility` | `node` | content |
| `packages/realtime/test/alpine/realtimePlugin.test.ts` | `realtime` | `integration` | `happy-dom` | filename |
| `packages/realtime/test/backoff.test.ts` | `realtime` | `utility` | `node` | content |
| `packages/realtime/test/controller/RealtimeController.test.ts` | `realtime` | `controller` | `node` | filename |
| `packages/realtime/test/heartbeat.test.ts` | `realtime` | `utility` | `node` | content |
| `packages/realtime/test/reconnect.test.ts` | `realtime` | `utility` | `node` | content |
| `packages/realtime/test/visibility.test.ts` | `realtime` | `utility` | `node` | content |
| `packages/scroll/e2e/scroll.e2e.spec.ts` | `scroll` | `e2e` | `playwright` | path |
| `packages/scroll/test/a11y.spec.ts` | `scroll` | `accessibility` | `happy-dom` | content |
| `packages/scroll/test/alpine-adapters.spec.ts` | `scroll` | `utility` | `happy-dom` | content |
| `packages/scroll/test/contract.spec.ts` | `scroll` | `contract` | `happy-dom` | vitest-directive |
| `packages/scroll/test/controller.spec.ts` | `scroll` | `controller` | `happy-dom` | content |
| `packages/scroll/test/coverage-gaps.spec.ts` | `scroll` | `utility` | `happy-dom` | content |
| `packages/scroll/test/criticals-fix.spec.ts` | `scroll` | `utility` | `happy-dom` | content |
| `packages/scroll/test/internals.spec.ts` | `scroll` | `utility` | `happy-dom` | content |
| `packages/scroll/test/lifecycle.spec.ts` | `scroll` | `utility` | `happy-dom` | content |
| `packages/scroll/test/mount-init-failure.spec.ts` | `scroll` | `utility` | `happy-dom` | content |
| `packages/scroll/test/plugin.spec.ts` | `scroll` | `integration` | `happy-dom` | filename |
| `packages/scroll/test/ssr.spec.ts` | `scroll` | `contract` | `node` | filename |
| `packages/selection/e2e/selection.e2e.spec.ts` | `selection` | `e2e` | `playwright` | path |
| `packages/selection/test/accessibility.test.ts` | `selection` | `accessibility` | `node` | content |
| `packages/selection/test/adapter.test.ts` | `selection` | `integration` | `happy-dom` | filename |
| `packages/selection/test/controller.test.ts` | `selection` | `controller` | `node` | filename |
| `packages/selection/test/demo-interaction.test.ts` | `selection` | `utility` | `happy-dom` | content |
| `packages/selection/test/demo-scope.test.ts` | `selection` | `utility` | `happy-dom` | content |
| `packages/selection/test/encapsulation.test.ts` | `selection` | `contract` | `node` | content |
| `packages/selection/test/lifecycle.test.ts` | `selection` | `utility` | `node` | content |
| `packages/selection/test/navigation.test.ts` | `selection` | `utility` | `node` | content |
| `packages/selection/test/plugin.test.ts` | `selection` | `integration` | `happy-dom` | content |
| `packages/selection/test/serialization.test.ts` | `selection` | `utility` | `node` | content |
| `packages/selection/test/ssr.test.ts` | `selection` | `contract` | `node` | filename |
| `packages/selection/test/store.test.ts` | `selection` | `integration` | `happy-dom` | filename |
| `packages/selection/test/toggle-range.test.ts` | `selection` | `utility` | `node` | content |
| `packages/selection/test/transitions.test.ts` | `selection` | `utility` | `node` | content |
| `packages/sidebar/e2e/sidebar.e2e.spec.ts` | `sidebar` | `e2e` | `playwright` | path |
| `packages/sidebar/test/manager.spec.ts` | `sidebar` | `utility` | `happy-dom` | content |
| `packages/sidebar/test/persist.spec.ts` | `sidebar` | `utility` | `node` | content |
| `packages/sidebar/test/plugin.spec.ts` | `sidebar` | `integration` | `happy-dom` | content |
| `packages/sidebar/test/storage.spec.ts` | `sidebar` | `utility` | `happy-dom` | content |
| `packages/sidebar/test/types.test.ts` | `sidebar` | `utility` | `node` | content |
| `packages/tabs/e2e/tabs.e2e.spec.ts` | `tabs` | `e2e` | `playwright` | path |
| `packages/tabs/test/tabs.test.ts` | `tabs` | `utility` | `happy-dom` | content |
| `packages/theme/e2e/theme.smoke.spec.ts` | `theme` | `e2e` | `playwright` | path |
| `packages/theme/test/cross-tab.spec.ts` | `theme` | `utility` | `happy-dom` | content |
| `packages/theme/test/id.spec.ts` | `theme` | `utility` | `node` | content |
| `packages/theme/test/manager.spec.ts` | `theme` | `utility` | `happy-dom` | content |
| `packages/theme/test/plugin.spec.ts` | `theme` | `integration` | `happy-dom` | content |
| `packages/theme/test/singleton-scope.spec.ts` | `theme` | `utility` | `node` | content |
| `packages/theme/test/ssr.spec.ts` | `theme` | `contract` | `node` | filename |
| `packages/theme/test/storage.spec.ts` | `theme` | `utility` | `happy-dom` | content |
| `packages/toast/e2e/toast.e2e.spec.ts` | `toast` | `e2e` | `playwright` | path |
| `packages/toast/test/alpine.integration.test.ts` | `toast` | `integration` | `happy-dom` | content |
| `packages/toast/test/inference.test.ts` | `toast` | `utility` | `node` | content |
| `packages/toast/test/toast.test.ts` | `toast` | `utility` | `node` | filename |
| `packages/toggle/test/controller.spec.ts` | `toggle` | `controller` | `node` | filename |
| `packages/toggle/test/plugin.spec.ts` | `toggle` | `integration` | `happy-dom` | filename |
| `packages/tooltip/e2e/tooltip.e2e.spec.ts` | `tooltip` | `e2e` | `playwright` | path |
| `packages/tooltip/test/alpine.anchor.integration.test.ts` | `tooltip` | `utility` | `happy-dom` | content |
| `packages/tooltip/test/alpine.reactivity.test.ts` | `tooltip` | `integration` | `happy-dom` | content |
| `packages/tooltip/test/encapsulation.test.ts` | `tooltip` | `contract` | `node` | content |
| `packages/tooltip/test/tooltip.test.ts` | `tooltip` | `utility` | `happy-dom` | content |
| `packages/transfer/e2e/transfer.e2e.spec.ts` | `transfer` | `e2e` | `playwright` | path |
| `packages/transfer/test/clipboard.test.ts` | `transfer` | `utility` | `node` | content |
| `packages/transfer/test/export.test.ts` | `transfer` | `utility` | `happy-dom` | content |
| `packages/transfer/test/inference.test.ts` | `transfer` | `utility` | `node` | content |
| `packages/transfer/test/share.test.ts` | `transfer` | `utility` | `node` | content |
| `packages/transfer/test/transfer.test.ts` | `transfer` | `utility` | `node` | content |
| `packages/ui/test/contract.spec.ts` | `ui` | `contract` | `happy-dom` | content |
| `packages/ui/test/media.spec.ts` | `ui` | `utility` | `node` | content |
| `packages/ui/test/storage.spec.ts` | `ui` | `utility` | `happy-dom` | content |
| `packages/virtual/e2e/virtual.e2e.spec.ts` | `virtual` | `e2e` | `playwright` | path |
| `packages/virtual/test/accessibility.test.ts` | `virtual` | `accessibility` | `node` | content |
| `packages/virtual/test/benchmark.test.ts` | `virtual` | `utility` | `node` | content |
| `packages/virtual/test/controller.test.ts` | `virtual` | `controller` | `node` | filename |
| `packages/virtual/test/encapsulation.test.ts` | `virtual` | `contract` | `node` | content |
| `packages/virtual/test/lifecycle.test.ts` | `virtual` | `utility` | `node` | content |
| `packages/virtual/test/observers.test.ts` | `virtual` | `utility` | `happy-dom` | content |
| `packages/virtual/test/plugin.test.ts` | `virtual` | `integration` | `happy-dom` | content |
| `packages/virtual/test/ssr.test.ts` | `virtual` | `contract` | `node` | filename |
| `test/architecture-check.test.ts` | `repository` | `repository` | `happy-dom` | content |
| `test/ci-changes.test.ts` | `repository` | `utility` | `node` | content |
| `test/headless-css-policy.test.ts` | `repository` | `utility` | `node` | content |
| `test/pack-check.test.ts` | `repository` | `repository` | `node` | content |
| `test/package-catalog-check.test.ts` | `repository` | `utility` | `node` | content |
| `test/public-surface-contract.test.ts` | `repository` | `utility` | `node` | content |
| `test/repo-check.test.ts` | `repository` | `utility` | `node` | content |
| `test/setup-modules.test.ts` | `repository` | `utility` | `node` | content |
| `test/test-environment-inventory.test.ts` | `repository` | `utility` | `node` | content |
| `test/tree-shaking-smoke.test.ts` | `repository` | `utility` | `node` | content |
| `test/vitest-package-scripts.test.ts` | `repository` | `repository` | `node` | content |
| `test/vitest-performance.test.ts` | `repository` | `utility` | `node` | content |
| `test/vitest-projects.test.ts` | `repository` | `utility` | `node` | content |

