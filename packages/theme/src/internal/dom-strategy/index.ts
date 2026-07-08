/**
 * DOM strategy — the layer that applies the resolved theme to the page.
 *
 * The module is split into one file per strategy variant (mirroring
 * the layout of `internal/storage/`):
 *
 * - `./class` — toggles a `dark` / `light` class on the target element.
 *   Most CSS frameworks (Tailwind, Bootstrap) use this convention.
 * - `./attribute` — sets a `data-theme="..."` attribute. Good for
 *   component libraries that need a stable selector.
 * - `./none` — skips DOM mutation entirely (server / node use).
 *
 * This barrel exposes the discriminated {@link DomStrategyOptions}
 * union, the {@link DomStrategy} contract, and the
 * {@link createDomStrategy} factory. Consumers (the manager) depend
 * only on the barrel, not on the per-strategy files.
 *
 * Each strategy is also responsible for cleaning up the previous
 * value before applying the next one — callers do not need to track
 * the previous state.
 */

export type {
    AttributeOptions,
    BaseOptions,
    ClassOptions,
    DomStrategy,
    DomStrategyOptions,
    NoneOptions,
} from './types';

import { AttributeStrategy } from './attribute';
import { ClassStrategy } from './class';
import { NoneStrategy } from './none';
import type { DomStrategy, DomStrategyOptions } from './types';

/** Builds the strategy that matches `options.strategy`. */
export function createDomStrategy(options: DomStrategyOptions): DomStrategy {
    switch (options.strategy) {
        case 'class':
            return new ClassStrategy(options);
        case 'attribute':
            return new AttributeStrategy(options);
        case 'none':
            return new NoneStrategy(options);
    }
}
