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

/**
 * Event map for carousel state changes. Emits `slideChange` on
 * every slide transition so consumers can react programmatically.
 */
export interface CarouselEvents extends Record<string, unknown> {
  slideChange: CarouselSlideChangeDetail;
}
