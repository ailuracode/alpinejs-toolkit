/**
 * `'attribute'` DOM strategy — sets `data-theme="light|dark"` on the target.
 *
 * Useful for component libraries that prefer a stable CSS attribute
 * selector over a class. The default attribute name is `data-theme`
 * to match the convention popularized by Radix UI and friends.
 *
 * Each apply overwrites the attribute with the new resolved value;
 * there is no accumulation because the attribute key is fixed.
 */

import { safeDocument } from '@ailuracode/alpine-core';
import type { ResolvedTheme } from '../../types';
import type { AttributeOptions, DomStrategy } from './types';
import { safeDocumentElement } from '../browser';

export type { AttributeOptions };

export class AttributeStrategy implements DomStrategy {
    readonly #configuredTarget: HTMLElement | null;
    readonly #attribute: string;
    #current: ResolvedTheme | null = null;

    constructor(options: AttributeOptions) {
        this.#configuredTarget = options.target;
        this.#attribute = options.attribute;
    }

    apply(resolved: ResolvedTheme): void {
        const target = this.#configuredTarget ?? safeDocumentElement();
        if (!target || resolved === this.#current) {
            return;
        }
        target.setAttribute(this.#attribute, resolved);
        this.#current = resolved;
    }

    destroy(): void {
        const target = this.#configuredTarget ?? safeDocumentElement();
        if (target && this.#current !== null) {
            target.removeAttribute(this.#attribute);
        }
        this.#current = null;
    }
}