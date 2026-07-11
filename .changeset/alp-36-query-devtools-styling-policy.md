---
"@ailuracode/alpine-query-kit": minor
---

Document and enforce a path-scoped styling exception for Query Devtools (ALP-36).

## `@ailuracode/alpine-query-kit`

- Main entry is now **headless only** — no devtools UI in the default bundle.
- Devtools move to **`@ailuracode/alpine-query-kit/devtools`** subpath.
- `queryKitWithDevtoolsPlugin` replaces `queryKit({ devtools: options })`.
- `repo:check` scans for headless CSS violations outside `packages/query-kit/src/devtools/**`.

## Migration

```diff
- import queryKit, { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit";
+ import queryKit from "@ailuracode/alpine-query-kit";
+ import { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

Alpine.plugin(queryKit());
- Alpine.plugin(queryKit({ devtools: { theme: "dark" } }));
+ import { queryKitWithDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";
+ Alpine.plugin(queryKitWithDevtoolsPlugin({ devtools: { theme: "dark" } }));
```

Production apps that only need the cache + Nanostores adapter can keep `import queryKit from "@ailuracode/alpine-query-kit"` without pulling devtools styles into the bundle.
