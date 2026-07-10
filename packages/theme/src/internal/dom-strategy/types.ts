/**
 * Shared types for the DOM strategy module.
 *
 * The strategy contract is split across multiple files (one per
 * strategy variant) but they all share the same {@link DomStrategy}
 * surface and the same options base. Keeping the public contract and
 * the option unions here makes the module easy to audit and lets each
 * strategy file import only what it needs.
 */

import type { ResolvedTheme, ThemeDomStrategy } from "../../types";

/** Public contract every DOM strategy implements. */
export interface DomStrategy {
  /** Applies the current resolved theme to the configured target. */
  apply(resolved: ResolvedTheme): void;
  /** Releases the reference to the target. Idempotent. */
  destroy(): void;
}

/** Common option fields every strategy option union shares. */
export interface BaseOptions {
  readonly target: HTMLElement | null;
  readonly strategy: ThemeDomStrategy;
}

/** Options for the `'class'` strategy. */
export interface ClassOptions extends BaseOptions {
  readonly strategy: "class";
  readonly darkClass: string;
  readonly lightClass: string;
}

/** Options for the `'attribute'` strategy. */
export interface AttributeOptions extends BaseOptions {
  readonly strategy: "attribute";
  readonly attribute: string;
}

/** Options for the `'none'` strategy. */
export interface NoneOptions extends BaseOptions {
  readonly strategy: "none";
}

/** Discriminated union of every strategy's option shape. */
export type DomStrategyOptions = ClassOptions | AttributeOptions | NoneOptions;
