/**
 * `'class'` DOM strategy — toggles `dark` / `light` on the target.
 *
 * Most CSS frameworks (Tailwind, Bootstrap, shadcn/ui) key their
 * dark-mode styles off a class on `<html>`. This strategy is the
 * default because it matches that convention.
 *
 * The strategy removes the previous class (and the alternate one) on
 * every apply, which guarantees no stale class lingers when consumers
 * rename `darkClass` / `lightClass` at runtime.
 */

import type { ResolvedTheme } from '../../types';
import type { ClassOptions, DomStrategy } from './types';
import { safeDocumentElement } from '../browser';

export type { ClassOptions };

export class ClassStrategy implements DomStrategy {
    readonly #configuredTarget: HTMLElement | null;
    readonly #darkClass: string;
    readonly #lightClass: string;
    #current: ResolvedTheme | null = null;

    constructor(options: ClassOptions) {
        this.#configuredTarget = options.target;
        this.#darkClass = options.darkClass;
        this.#lightClass = options.lightClass;
    }

    apply(resolved: ResolvedTheme): void {
        const target = this.#configuredTarget ?? safeDocumentElement();
        if (!target || resolved === this.#current) {
            return;
        }
        // Remove both classes (or the same one twice — idempotent) before
        // adding the new one. This guarantees no stale class lingers when
        // the consumer renames `darkClass` / `lightClass` at runtime.
        target.classList.remove(this.#darkClass, this.#lightClass);
        target.classList.add(resolved === 'dark' ? this.#darkClass : this.#lightClass);
        this.#current = resolved;
    }

    destroy(): void {
        const target = this.#configuredTarget ?? safeDocumentElement();
        if (target && this.#current) {
            target.classList.remove(this.#darkClass, this.#lightClass);
        }
        this.#current = null;
    }
}