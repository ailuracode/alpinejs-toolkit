/**
 * Strongly-typed event map for the notify controller.
 *
 * Notify is magic-based and currently emits no custom events,
 * but the interface exists for future extension and consistency
 * with the headless controller pattern.
 */

export interface NotifyEvents extends Record<string, unknown> {}
