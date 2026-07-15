# @ailuracode/alpine-carousel

Headless accessible carousel store for Alpine.js, powered by [Embla Carousel](https://www.embla-carousel.com/).

## Install

```bash
pnpm add @ailuracode/alpine-carousel alpinejs
```

Peer dependencies: `embla-carousel` and `embla-carousel-autoplay` are bundled as direct dependencies.

## Quick start

```ts
import Alpine from "alpinejs";
import carousel from "@ailuracode/alpine-carousel";

Alpine.plugin(carousel());
Alpine.start();
```

## Basic markup

```html
<div
  x-data
  x-init="
    $store.carousel.create('gallery');
    $nextTick(() => $store.carousel.bindViewport('gallery', $refs.viewport))
  "
  @keydown="$store.carousel.handleKeydown('gallery', $event)"
>
  <section x-bind="$store.carousel.carouselProps('gallery', { label: 'Featured gallery' })">
    <div x-ref="viewport" x-bind="$store.carousel.viewportProps('gallery')" class="min-w-0 w-full overflow-hidden">
      <div class="flex touch-pan-y pinch-zoom">
        <div class="min-w-0 shrink-0 grow-0 flex-[0_0_var(--slide-size,100%)]" x-bind="$store.carousel.slideProps('gallery', 0)">Slide 1</div>
        <div class="min-w-0 shrink-0 grow-0 flex-[0_0_var(--slide-size,100%)]" x-bind="$store.carousel.slideProps('gallery', 1)">Slide 2</div>
      </div>
    </div>

    <button type="button" @click="$store.carousel.previous('gallery')">Previous</button>
    <button type="button" @click="$store.carousel.next('gallery')">Next</button>
  </section>
</div>
```

Embla expects the **viewport** element (overflow hidden) with a **container** child and **slides** as descendants of the container. `viewportProps()` sets `--slide-size: 100%` on the viewport; size slides with `flex: 0 0 var(--slide-size)` and `min-width: 0`. Avoid `width: 100%` on slides — it resolves against the flex container and overflows on mobile.

## Store API

| Method | Description |
|--------|-------------|
| `create(id, options?)` | Register a carousel instance |
| `bindViewport(id, element)` | Mount Embla on the viewport element |
| `destroy(id)` | Destroy Embla and remove the instance |
| `next(id)` / `previous(id)` | Navigate slides |
| `goTo(id, index)` | Jump to a slide |
| `current(id)` / `count(id)` | Current index and total slides |
| `canNext(id)` / `canPrevious(id)` | Scroll availability |
| `play(id)` / `pause(id)` / `isPlaying(id)` | Autoplay controls |
| `handleKeydown(id, event)` | Arrow keys, Home, End |
| `carouselProps(id, options?)` | ARIA region props |
| `viewportProps(id, options?)` | Focusable viewport props; sets `--slide-size` (default `100%`, pass `{ slideSize: false }` to use CSS classes instead) |
| `slideProps(id, index)` | Per-slide ARIA props |
| `indicatorProps(id, index)` | Dot/thumbnail button props |

### Reactive state

Each entry in `$store.carousel.instances[id]` is a **reactive mirror** of controller state (updated on `change` and `slideChange`). Use store commands to mutate; direct writes to `instances[id]` do not affect the controller.

Exposed fields:

- `currentIndex`, `totalSlides`, `progress`
- `isFirst`, `isLast`, `isPlaying`
- `canNext`, `canPrevious`, `slidesInView`

## Standalone usage (no Alpine)

```ts
import {
  createCarouselController,
  createCarouselStore,
  createCarouselStoreFromController,
} from "@ailuracode/alpine-carousel";

const controller = createCarouselController();
controller.create("gallery", { loop: true });
controller.current("gallery"); // 0

const store = createCarouselStore();
// or: createCarouselStoreFromController(controller)
```

| Controller API | Description |
|----------------|-------------|
| `hasInstance(id)` | Whether a carousel id is registered |
| `snapshotInstances()` | Shallow readonly copies for adapter sync |
| `current(id)` / `count(id)` / `isPlaying(id)` | Query methods |

Subscribe to `controller.on("change", …)` and `controller.on("slideChange", …)` for adapter sync.

## Architecture

`CarouselController` owns all mutable state and the Embla instances. The Alpine plugin mirrors snapshots into `$store.carousel.instances`.

## Migration

| Removed / changed | Replacement |
|-------------------|-------------|
| `controller.instances` getter | `snapshotInstances()` or `hasInstance(id)` |
| `controller.toStore()` | `createCarouselStore()` or `createCarouselStoreFromController(controller)` |
| `$store.carousel.instance(id)` | `goTo(id, index)`, `next(id)`, `previous(id)`, and other semantic store methods |
| `CarouselInstance.embla` / `.autoplay` / `.viewport` on snapshots | Use semantic store methods and readonly snapshot fields |
| `CarouselOptions.align` / `.containScroll` typed via Embla | Toolkit-owned `CarouselAlign` and `CarouselContainScroll` types |
| (none) | `storeKey` — see [Avoiding name collisions](#avoiding-name-collisions) |

### Avoiding name collisions

If your application already owns a `$store.carousel` — or another toolkit plugin registers on that name — rename the integration surface without touching the controller:

```ts
Alpine.plugin(carouselPlugin({ storeKey: "slider" })); // → $store.slider
```

The exposed constant `DEFAULT_CAROUSEL_STORE_KEY` keeps the rename discoverable from TypeScript.

## Options

| Option | Default | Maps to Embla |
|--------|---------|---------------|
| `loop` | `false` | `loop` |
| `axis` | `'x'` | `axis` |
| `align` | `'start'` | `align` |
| `containScroll` | `'trimSnaps'` | `containScroll` |
| `dragFree` | `false` | `dragFree` |
| `duration` | `25` | `duration` |
| `autoplay` | `false` | `embla-carousel-autoplay` |
| `autoplayOptions.delay` | `4000` | autoplay delay |
| `autoplayOptions.stopOnMouseEnter` | `false` | Pause on hover |
| `autoplayOptions.stopOnInteraction` | `true` (`false` when hover pause is on) | Pause on drag/click; must be `false` for hover resume |
| `autoplayOptions.stopWhenHidden` | `true` | Pause when the document is hidden (plugin-managed) |
| `ariaLive` | `'polite'` | `aria-live` on carousel region |
| `onChange` | — | Callback when slide index changes |

## License

MIT
