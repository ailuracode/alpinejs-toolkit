---
"@ailuracode/alpine-carousel": patch
---

Hide Embla implementation types from the public API.

### Migration

- Removed `$store.carousel.instance(id)` and `CarouselController.instance(id)`. Use semantic methods instead: `goTo(id, index)`, `next(id)`, `previous(id)`, `play(id)`, `pause(id)`, and readonly snapshot fields on `$store.carousel.instances[id]`.
- `CarouselInstance` snapshots no longer expose `embla`, `autoplay`, or `viewport`. Engine handles stay private to `CarouselController`.
- `CarouselOptions.align` and `CarouselOptions.containScroll` now use toolkit-owned `CarouselAlign` and `CarouselContainScroll` types instead of re-exporting Embla option types.
