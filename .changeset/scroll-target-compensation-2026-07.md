---
"@ailuracode/alpine-scroll": minor
---

Add the `target` option to `ScrollOptions` so the lock manager applies the scrollbar-gap compensation directly to a configurable element instead of relying on consumers to wire the `--ailura-scrollbar-gap` CSS variable.

**New API on `ScrollOptions`:**

```ts
readonly target?: Element | string | null;
```

- `Element` reference — the LockManager snapshots the element's `padding-right` on first lock, sets it to the measured scrollbar width on lock, and restores the original value on unlock / destroy.
- CSS selector string — resolved once via `document.querySelector`. Same snapshot / apply / restore semantics.
- `null` (default) — no automatic compensation. The `--ailura-scrollbar-gap` CSS variable is still set on `<html>` for consumers that wire it manually.

**Behaviour:**

- The compensation only fires when `reserveScrollbarGap: true` (the default).
- Stack-safe — multiple locks share the same target; only the outermost lock manages the padding.
- On `destroy()` the target is restored to its pre-lock `padding-right` regardless of remaining lock count.
- Selector strings that resolve to no element degrade to a no-op (the CSS variable still applies).

**Demo wiring** (`apps/demo/src/demo/plugin-registry.ts`):

```ts
scrollPlugin({
  id: "scroll",
  respectReducedMotion: true,
  reserveScrollbarGap: true,
  target: document.body,
});
```

This fixes the layout jump when the sidebar / dialog / menu lock fires — without the target, the body's scrollbar disappears and the visible content shifts to fill the freed ~15px.

**Not breaking:**

- Existing `ScrollOptions` fields keep their shape and defaults.
- `target: null` (the new default) matches the previous behaviour where only the CSS variable was set.
- `LockManager` internal `BodyLockStylesSnapshot` grew a `paddingRight` field — purely internal.