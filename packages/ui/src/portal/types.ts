/**
 * Public options for {@link createPortalRoot}.
 *
 * - `id` — the DOM id of the portal container. Defaults to
 *   `"overlay-root"` (matches the convention used by the
 *   `@ailuracode/alpine-overlay` plugin).
 * - `className` — optional class list applied when the portal is
 *   created (existing elements are not re-styled).
 * - `as` — element tag. Default is `"div"`. The plugin is
 *   headless — the tag controls semantic role only.
 */
export interface PortalRootOptions {
  /**
   * Portal container id. Defaults to `"overlay-root"`. Pass a
   * custom value when the consumer already manages a different
   * portal layer.
   */
  readonly id?: string;
  /** Class list applied when the portal is created. */
  readonly className?: string;
  /** Tag of the created container. Default `"div"`. */
  readonly as?: keyof HTMLElementTagNameMap;
}