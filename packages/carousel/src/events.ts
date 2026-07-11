/**
 * Strongly-typed event map for the carousel controller.
 */

/**
 * Detail payload for the `slideChange` event.
 */
export interface CarouselSlideChangeDetail {
  readonly carouselId: string;
  readonly index: number;
  readonly totalSlides: number;
}

/** Detail payload for the `change` event (adapter sync). */
export interface CarouselChangeDetail {
  readonly carouselId?: string;
}

/**
 * Event map for carousel state changes. Emits `slideChange` on
 * every slide transition and `change` when instance state updates.
 */
export interface CarouselEvents extends Record<string, unknown> {
  slideChange: CarouselSlideChangeDetail;
  change: CarouselChangeDetail;
}
