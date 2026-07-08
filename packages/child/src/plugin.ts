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

/** Key under which `Alpine.directive(...)` registers the unwrap pass. */
const CHILD_DIRECTIVE_KEY = "child";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link ChildPluginOptions} to configure future cross-cutting knobs,
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 */
export function childPlugin(options: ChildPluginOptions = {}): ChildPluginCallback {
  return function registerChild(alpine: Alpine): void {
    // Narrow the base Alpine runtime to the toolkit's typed view.
    // The cast is the only `as unknown as` in this file — every
    // subsequent call is fully typed against `ChildAlpine`.
    const Alpine = alpine as unknown as ChildAlpine;
    const processedWrappers = new WeakSet<Element>();

    Alpine.addInitSelector(() => `[${Alpine.prefixed(CHILD_DIRECTIVE_KEY)}]`);

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
        warnChild("[x-child] No element child found; directive ignored.");
        return;
      }

      if (countElementChildren(el) > 1) {
        warnChild("[x-child] Multiple element children; only the first is used.");
      }

      const morph = Alpine.morph;
      if (typeof morph !== "function") {
        warnChild(
          "[x-child] @alpinejs/morph is required — register Alpine.plugin(morph) before x-child."
        );
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

    Alpine.directive(CHILD_DIRECTIVE_KEY, () => {
      // Unwrap runs in interceptInit before other directives on the wrapper.
    }).before("ignore");

    // `options.id` is currently unused at the plugin level — the
    // directive auto-tracks each wrapper via `processedWrappers`. The
    // field is reserved for future cross-cutting configuration
    // (logging hooks, scoped mutation observers, etc.). Reference the
    // parameter to keep the lint rule happy and signal intent.
    void options;
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

/**
 * Developer warnings for invalid markup. Console.warn is intentional —
 * the unwrap pass runs at Alpine init, where throwing would break
 * unrelated components.
 */
function warnChild(message: string): void {
  // biome-ignore lint/suspicious/noConsole: intentional developer warnings for invalid markup
  console.warn(message);
}
