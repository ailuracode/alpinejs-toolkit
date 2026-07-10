/**
 * Strongly-typed event map for transfer magics.
 *
 * Transfer magics are stateless callables — they don't emit events
 * through an EventEmitter. This module exists for structural consistency
 * with other toolkit packages.
 */
export interface TransferEvents extends Record<string, unknown> {}
