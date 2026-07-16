/**
 * Escape-key listener — wires a `keydown` listener on `window`
 * filtered to `event.key === 'Escape'`.
 *
 * The browser-API access goes through `safeWindow` from
 * `@ailuracode/alpine-core` so the SSR contract stays uniform with
 * the rest of the toolkit. SSR / Node callers (or runtimes without
 * `window`) get a no-op cleanup so the manager can wire teardown
 * uniformly through `BaseController.registerCleanup`.
 *
 * The listener is invoked with the raw `KeyboardEvent` so callers
 * can read `event.key`, `event.target`, and other fields without a
 * separate callback signature.
 */

import type { Unsubscribe } from "../core-deps.js";
import { safeWindow } from "../core-deps.js";

/**
 * Subscribes to `Escape` keydown events on `window`. Returns a
 * cleanup function that detaches the listener.
 *
 * Returns a no-op cleanup when the runtime has no `window` so the
 * manager can wire teardown uniformly.
 */
export function attachEscapeListener(listener: (event: KeyboardEvent) => void): Unsubscribe {
  const win = safeWindow();

  if (!win) {
    return () => undefined;
  }

  let active = true;
  const onKeyDown = (event: KeyboardEvent): void => {
    if (!active) {
      return;
    }
    if (event.key !== "Escape") {
      return;
    }
    listener(event);
  };

  win.addEventListener("keydown", onKeyDown);

  return () => {
    if (!active) {
      return;
    }
    active = false;
    win.removeEventListener("keydown", onKeyDown);
  };
}
