---
"@ailuracode/alpine-toggle": minor
---

Add `setSilently(value)` to `ToggleController` — sets the value without emitting a `change` event. Hydrates the controller from an external authoritative source (e.g. `localStorage`) without broadcasting a transition. The queued initialization microtask now preserves any value hydrated via `setSilently` before it fires, instead of resetting to the original `initial` config. Behavior of `reset()` and the public event surface is unchanged.