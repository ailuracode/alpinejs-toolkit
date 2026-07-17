---
"@ailuracode/alpine-toggle": patch
---

Reduce bundle size of `@ailuracode/alpine-toggle` by ~10% (gzipped) through internal refactors with **no public API changes**:

- **Inline mini-emitter** in `ToggleController` — the controller now manages its own single-event listener Map instead of importing `EventEmitter` from `@ailuracode/alpine-core`. `on` / `once` / `off` / `removeAllListeners` signatures and semantics are unchanged.
- **Inline state validation** — the `hasIndeterminateState`, `resolveInitial`, `isConfiguredState`, and `buildStateCycle` helpers previously in `src/internal/validation.ts` are now computed once in the controller's constructor (memoized on a private `#isConfigured` closure). Equivalent behaviour, fewer top-level functions in the bundle.
- **Remove `src/internal/reactive-adapter.ts`** — the facade object is now built directly inside the `togglePlugin` factory closure; the previous `buildReactiveToggleView` + `syncReactiveToggleView` helpers were only called from one site.

Bundle metrics (gzipped):

| Metric | Before | After |
|--------|--------|-------|
| `dist/index.js` (raw) | 2.70 KB | 2.44 KB |
| Size-limit bundle (gzip) | 1.14 KB | 1.08 KB |

All 33 tests pass. The exported surface (`createToggle`, `togglePlugin`, `ToggleController`, types, `DEFAULT_TOGGLE_MAGIC_KEY`, `Unsubscribe` re-export) is unchanged.
