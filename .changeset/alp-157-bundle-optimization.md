---
"@ailuracode/alpine-calendar": major
"@ailuracode/alpine-carousel": minor
"@ailuracode/alpine-form": major
"@ailuracode/alpine-query": minor
"@ailuracode/alpine-query-kit": minor
"@ailuracode/alpine-realtime": minor
"@ailuracode/alpine-scroll": minor
"@ailuracode/alpine-selection": major
---

Reduce consumer bundle sizes via optional subpath imports and lighter default entrypoints.

- **calendar**: Native `Date`/`Intl` adapter is the default runtime; date-fns moves to `@ailuracode/alpine-calendar/date-fns`.
- **carousel**: Autoplay loads from `@ailuracode/alpine-carousel/autoplay` instead of the initial chunk.
- **query**: Devtools instrumentation is opt-in via `@ailuracode/alpine-query/instrumentation`.
- **query-kit**: Devtools panel requires explicit instrumentation wiring.
- **realtime**: Add `@ailuracode/alpine-realtime/sse` and `/websocket` protocol entrypoints.
- **scroll**: Add `@ailuracode/alpine-scroll/lock` and `/navigation` capability entrypoints.
- **form**: Move controller, validation helpers, JSON:API, and Standard Schema utilities to dedicated subpaths.
- **selection**: Move serialization and navigation utilities to dedicated subpaths.
