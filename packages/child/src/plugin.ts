/**
 * Alpine.js integration for `@ailuracode/alpine-child`.
 *
 * Thin adapter that registers the `x-child` directive. The unwrap pass
 * runs in `Alpine.interceptInit` so the wrapper is hidden before its
 * own descendants init, and the morph swap is deferred to the next
 * tick so sibling components (e.g. `x-show` on a sidebar) init first.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — import any of the helpers in `./controller` directly
 *    for tests, custom directives, or non-Alpine adapters.
 * 2. Alpine — `childPlugin({ id? })` returns the `Alpine.plugin()`
 *    callback that registers the directive.
 *
 * The framework-agnostic logic lives in `./controller` and
 * `./internal/transfer`. This file is the only place that imports
 * Alpine APIs.
 */

import { guardDirective } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import {
  clearTransferredAttributes,
  countElementChildren,
  findFirstElementChild,
  parseChildDirective,
  transferAttributes,
} from "./controller.js";
import type {
  ChildAlpine,
  ChildMorphOptions,
  ChildPluginCallback,
  ChildPluginOptions,
} from "./types";
import { DEFAULT_CHILD_DIRECTIVE_KEY } from "./types";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link ChildPluginOptions} to configure future cross-cutting knobs,
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 */
export function childPlugin(options: ChildPluginOptions = {}): ChildPluginCallback {
  const directiveKey = options.directiveKey ?? DEFAULT_CHILD_DIRECTIVE_KEY;

  return function registerChild(alpine: Alpine): void {
    // Narrow the base Alpine runtime to the toolkit's typed view.
    // The cast is the only `as unknown as` in this file — every
    // subsequent call is fully typed against `ChildAlpine`.
    const Alpine = alpine as unknown as ChildAlpine;
    const processedWrappers = new WeakSet<Element>();

    Alpine.addInitSelector(() => `[${Alpine.prefixed(directiveKey)}]`);

    Alpine.interceptInit((el: Element, skip: () => void) => {
      const config = parseChildDirective(el);
      if (!config) {
        return;
      }

      if (processedWrappers.has(el)) {
        return;
      }

      const target = findFirstElementChild(el);
      if (!target) {
        return;
      }

      if (countElementChildren(el) > 1) {
        // Multiple element children: only the first is used. Silently
        // ignored — consumers should validate their markup at build time.
      }

      const morph = Alpine.morph;
      if (typeof morph !== "function") {
        return;
      }

      // Defer unwrap until after the current initTree pass so DOM mutations from
      // morph do not corrupt scope for siblings initialized later (e.g. sidebar).
      processedWrappers.add(el);
      (el as AlpineElement)._x_ignoreSelf = true;
      (target as AlpineElement)._x_ignore = true;
      skip();

      Alpine.nextTick(() => {
        if (!(el.isConnected || target.isConnected)) {
          return;
        }

        transferAttributes(el, target, config.mode);

        let promoted: Element | null = null;

        Alpine.mutateDom(() => {
          const morphOptions: ChildMorphOptions = {
            added(node) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                promoted = node as Element;
              }
            },
          };
          morph(el, target.outerHTML, morphOptions);
        });

        const result = promoted ?? (el.isConnected ? el : null);
        if (result) {
          processedWrappers.add(result);
          (result as AlpineElement)._x_ignore = undefined;
          Alpine.initTree(result as HTMLElement);
        }

        clearTransferredAttributes(el);
      });
    });

    const directiveChain = guardDirective(
      Alpine,
      directiveKey,
      () => {
        // Unwrap runs in interceptInit before other directives on the wrapper.
        return {};
      },
      "child"
    );

    // Schedule the unwrap pass before `x-ignore` so the wrapper is
    // hidden before any directive evaluates against it.
    if (directiveChain && typeof (directiveChain as { before?: unknown }).before === "function") {
      (directiveChain as { before: (modifier: string) => unknown }).before("ignore");
    }
  };
}

/** Default export matches the named `childPlugin` for ergonomic `import child from …`. */
export default childPlugin;

// ── Private helpers ─────────────────────────────────────────────────────────

/**
 * Subset of Alpine's per-element hooks the unwrap pass touches. Alpine
 * augments `Element` with these at runtime; the cast lives here so the
 * rest of the file stays free of `as Element & { ... }` noise.
 */
type AlpineElement = Element & {
  _x_ignore?: boolean;
  _x_ignoreSelf?: boolean;
};
