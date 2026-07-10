/**
 * Maps the public {@link CreateThemeOptions} shape into the
 * discriminated {@link DomStrategyOptions} union the strategy factory
 * consumes. Lives next to the strategies so the wiring between the
 * public config and the infrastructure options stays in one place.
 */

import type { CreateThemeOptions } from "../../types";
import type { DomStrategyOptions } from "./types";

/**
 * Defaults: `strategy: 'class'`, `darkClass: 'dark'`,
 * `lightClass: 'light'`, `attribute: 'data-theme'`.
 */
export function buildDomOptions(
  options: CreateThemeOptions,
  target: HTMLElement | null
): DomStrategyOptions {
  const strategy = options.strategy ?? "class";
  switch (strategy) {
    case "class":
      return {
        strategy: "class",
        target,
        darkClass: options.darkClass ?? "dark",
        lightClass: options.lightClass ?? "light",
      };
    case "attribute":
      return {
        strategy: "attribute",
        target,
        attribute: options.attribute ?? "data-theme",
      };
    case "none":
      return { strategy: "none", target };
  }
}
