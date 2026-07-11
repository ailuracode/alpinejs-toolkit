import Alpine from "alpinejs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";

const { EmblaCarouselMock } = vi.hoisted(() => ({
  EmblaCarouselMock: vi.fn(),
}));

vi.mock("embla-carousel", () => ({
  default: EmblaCarouselMock,
}));

vi.mock("embla-carousel-autoplay", () => ({
  default: vi.fn(),
}));

import carouselPlugin from "../src/index.js";

function createEmblaMock(total = 5) {
  let index = 0;
  const api = {
    on: vi.fn(),
    destroy: vi.fn(),
    selectedScrollSnap: vi.fn(() => index),
    scrollSnapList: vi.fn(() => Array.from({ length: total }, (_, i) => i)),
    scrollProgress: vi.fn(() => 0),
    canScrollNext: vi.fn(() => index < total - 1),
    canScrollPrev: vi.fn(() => index > 0),
    slidesInView: vi.fn(() => [index]),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
    scrollTo: vi.fn((next: number) => {
      index = next;
      for (const [event, handler] of api.on.mock.calls) {
        if (event === "select") {
          handler();
        }
      }
    }),
    reInit: vi.fn(),
  };
  return api;
}

describe("@ailuracode/alpine-carousel reactivity", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders indicators after the viewport binds and updates on slide change", async () => {
    EmblaCarouselMock.mockImplementation(() => createEmblaMock(5));
    startAlpine(carouselPlugin());

    document.body.innerHTML = `
      <div
        x-data
        x-init="
          $store.carousel.create('indicators');
          $nextTick(() => $store.carousel.bindViewport('indicators', $refs.viewport));
        "
      >
        <div x-ref="viewport" class="overflow-hidden">
          <div class="flex">
            <template x-for="n in 5" :key="n">
              <div class="min-w-full" x-text="'slide ' + n"></div>
            </template>
          </div>
        </div>
        <div id="dots">
          <template x-for="n in $store.carousel.count('indicators')" :key="n">
            <button
              type="button"
              :id="'dot-' + (n - 1)"
              x-bind:class="$store.carousel.current('indicators') === n - 1 ? 'active' : ''"
              @click="$store.carousel.goTo('indicators', n - 1)"
            ></button>
          </template>
        </div>
      </div>
    `;

    await Alpine.nextTick();
    await Promise.resolve();
    await Alpine.nextTick();

    expect(document.querySelectorAll("#dots button")).toHaveLength(5);
    expect(document.getElementById("dot-0")?.className).toBe("active");

    document.getElementById("dot-2")?.click();
    await Alpine.nextTick();

    expect(document.getElementById("dot-2")?.className).toBe("active");
    expect(document.getElementById("dot-0")?.className).toBe("");
  });
});
