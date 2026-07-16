# @ailuracode/alpine-json-api

## 1.0.2

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 1.0.1

### Patch Changes

- 2511f89: Declare `"sideEffects": false` on publishable packages that were missing the metadata, and enforce the policy in `repo:check` and `pack:check`.
- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
- Updated dependencies [0008894]
- Updated dependencies [577c59e]
- Updated dependencies [3c8b40f]
- Updated dependencies [5c4e9d3]
- Updated dependencies [1ae869c]
- Updated dependencies [2511f89]
- Updated dependencies [ade9bc7]
- Updated dependencies [556055a]
- Updated dependencies [a488cbb]
- Updated dependencies [aa88539]
- Updated dependencies [173379d]
- Updated dependencies [8b079b0]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
- Updated dependencies [12ca21e]
  - @ailuracode/alpine-query@0.6.2
  - @ailuracode/alpine-core@0.2.1

## 1.0.0

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.2

### Patch Changes

- Updated dependencies
  - @ailuracode/alpine-query@0.6.1

## 0.1.1

### Patch Changes

- 7a3a2e4: Add automatic `relationships.*.resolved` hydration from compound `included` documents and `jsonApiQueryOptions()` / `jsonApiFindOneQueryOptions()` helpers for `$store.query.observe()`.

## 0.1.0

### Minor Changes

- 50b6118: Add `@ailuracode/alpine-json-api` with a schema-driven typed JSON:API client and `$jsonapi` Alpine magic.

### Patch Changes

- Updated dependencies [e0c7f02]
  - @ailuracode/alpine-query@0.6.0
