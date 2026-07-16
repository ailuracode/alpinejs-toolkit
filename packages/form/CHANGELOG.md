# @ailuracode/alpine-form

## 0.1.1

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 0.1.0

### Minor Changes

- f1a7d55: Add TanStack Form-like `createForm()` API with `handleSubmit()`, `field().handleChange()` / `handleBlur()`, and `state.meta.errorMap`.

  Add Standard Schema v1 support for Zod, Valibot, ArkType, and Effect/Schema without bundling a schema library (`createStandardSchemaAdapter`, `validators.onSubmit: schema`).

### Patch Changes

- 9a44380: `@ailuracode/alpine-form` now exposes `storeKey` and `magicKey` on `formPlugin(options)` so hosts with a pre-existing `$store.form` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_FORM_STORE_KEY` / `DEFAULT_FORM_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "form"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `formPlugin()` instead of the raw key. Controller event-bus unsubscribes (`change` / `submit` / `submit-error`) are now bundled through the bridge's subscription cleanup so the reactive registry no longer leaks listeners on plugin destroy. This unblocks `@ailuracode/alpine-form` from the `registrationGuardPending` migration list tracked by `architecture:check`.
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

## 0.0.0

### Minor Changes

- Initial release of the headless form state and validation controller with Alpine store integration.
