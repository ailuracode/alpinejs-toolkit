---
"@ailuracode/alpine-media": minor
---

Input validation errors (`createMedia` / `resolveMediaBreakpoint` / `MediaController` constructor with empty `intervals`) now throw `@ailuracode/alpine-core`'s `ToolkitError` with `code: 'TOOLKIT_INVALID_ARGUMENT'` instead of a plain `Error`. Consumers can now branch on the error code:

```ts
import { ToolkitError } from "@ailuracode/alpine-core";

try {
  createMedia({ intervals: [] });
} catch (err) {
  if (err instanceof ToolkitError && err.code === "TOOLKIT_INVALID_ARGUMENT") {
    // handle invalid intervals
  }
}
```