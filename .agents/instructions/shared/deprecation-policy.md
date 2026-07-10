---
description: 'Deprecation policy for @ailuracode/alpinejs-toolkit public APIs.'
---

# Deprecation Policy

A public symbol that is going away MUST be marked. The marker is in code AND in the CHANGELOG AND in the version plan.

## JSDoc marker

```typescript
/**
 * Open the dialog without animation.
 *
 * @deprecated since 0.4.0 — use `open('fast')` instead.
 * @plannedRemoval 0.6.0
 * @see FeaturePlugin.open
 */
export function openInstant(dialog: DialogController): void {
    dialog.open({ skipAnimation: true });
}
```

Fields:

- `@deprecated since X.Y.Z` — the version that introduced the marker.
- `@plannedRemoval X.Y.Z` — the version where the symbol will be deleted.
- `@see <replacement>` — optional pointer to the replacement API.

## Versions

- The grace period is **2 minor versions**. A symbol marked in `0.4.0` is removed no earlier than `0.6.0`.
- Patch releases (`0.4.1`, `0.4.2`) do NOT extend the grace period.
- A patch release MAY revert a deprecation in the rare case the replacement is not feasible.

## CHANGELOG entry

Every deprecation MUST have a CHANGELOG entry under the next minor release, formatted:

```
### Deprecated

- `Feature.openInstant` — use `Feature.open('fast')` instead. Removal in 0.6.0.
```

The entry links to the JSDoc marker and to the PR.

## TypeScript

- The `@deprecated` tag at the JSDoc level triggers `tsc` to flag usages. Test the marker with a `*.spec-d.ts` file that asserts the type checker complains.
- A `@deprecated` type MUST still be exported until removal.

## Removal

- Removing a deprecated symbol is a `major` version bump (or a `minor` if the package is pre-`1.0` and the symbol was never declared stable).
- The removal PR MUST include a CHANGELOG entry under `### Removed`.
