/**
 * Strongly-typed event map for the menu controller.
 */

/** Detail payload for the `open` event. */
export interface MenuOpenDetail {
  readonly menuId: string;
}

/** Detail payload for the `close` event. */
export interface MenuCloseDetail {
  readonly menuId: string;
}

/** Detail payload for the `select` event. */
export interface MenuSelectDetail {
  readonly menuId: string;
  readonly itemId: string;
}

/**
 * Event map for menu state changes. Emits `open`, `close`, and `select`
 * events with typed detail payloads so consumers can react programmatically.
 */
export interface MenuEvents extends Record<string, unknown> {
  open: MenuOpenDetail;
  close: MenuCloseDetail;
  select: MenuSelectDetail;
}
