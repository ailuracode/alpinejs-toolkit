/**
 * `'none'` DOM strategy — keeps the manager fully headless.
 *
 * Useful for server / Node consumers and unit tests that want the
 * state machine and the event bus without any DOM side effects. Every
 * call is a no-op; the manager continues to emit transitions, the
 * storage adapter keeps persisting, and the system observer keeps
 * watching — only the DOM application is skipped.
 */

import type { ResolvedTheme } from '../../types';
import type { DomStrategy, NoneOptions } from './types';

export type { NoneOptions };

export class NoneStrategy implements DomStrategy {
    // Accept `NoneOptions` so the factory in `./index` can call
    // `new NoneStrategy(options)` with the same shape it uses for the
    // other strategies. The implicit zero-arg constructor would reject
    // the argument and break that symmetry.
    // oxlint-disable-next-line no-useless-constructor: required by the discriminated union
    constructor(_options: NoneOptions) {
        // intentionally empty
    }

    apply(_resolved: ResolvedTheme): void {
        // intentionally empty
    }

    destroy(): void {
        // intentionally empty
    }
}
