---
"@ailuracode/alpine-core": minor
---

Add `bridgeControllerDirective` to `@ailuracode/alpine-core`. The new helper is the symmetric counterpart of `bridgeControllerStore` for plugins that register an Alpine directive (`x-child`, `x-gesture`, …) instead of a store + magic pair. Like the store bridge, it routes the registration through `guardDirective`, defaults to `registrationOverride: true` (HMR / hot reload / repeated tests), and accepts `packageName` so `RegistrationError("REGISTRATION_COLLISION")` messages name the right factory. Cleanup automatically calls `untrackDirective` so subsequent plugin instances do not collide with themselves across HMR boundaries. The optional `controller` argument owns the destroy lifecycle; omitting it leaves only the untrack step. Feature packages that register directives (`@ailuracode/alpine-child`, `@ailuracode/alpine-gesture`) are now able to route their registrations through the same collision-aware plumbing as the rest of the toolkit.
