import type AlpineType from "alpinejs";
import {
  clearTransferredAttributes,
  countElementChildren,
  findFirstElementChild,
  parseChildDirective,
  transferAttributes,
} from "./transfer.js";

export type { ChildMergeMode } from "./transfer.js";
export {
  clearTransferredAttributes,
  countElementChildren,
  findFirstElementChild,
  parseChildDirective,
  transferAttributes,
} from "./transfer.js";

const processedWrappers = new WeakSet<Element>();

type AlpineElement = Element & {
  _x_ignore?: boolean;
  _x_ignoreSelf?: boolean;
};

type MorphOptions = {
  added?: (node: Node) => void;
};

type AlpineWithMorph = AlpineType.Alpine & {
  morph?: (el: Element, newHtml: string | Element, options?: MorphOptions) => Element;
};

function warnChild(message: string): void {
  // biome-ignore lint/suspicious/noConsole: intentional developer warnings for invalid markup
  console.warn(message);
}

/** Alpine.js plugin. Registers the `x-child` directive (asChild-style unwrapping). */
export default function childPlugin(Alpine: AlpineType.Alpine): void {
  Alpine.addInitSelector(() => `[${Alpine.prefixed("child")}]`);

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

    const morph = (Alpine as AlpineWithMorph).morph;
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
        morph(el, target.outerHTML, {
          added(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              promoted = node as Element;
            }
          },
        });
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

  Alpine.directive("child", () => {
    // Unwrap runs in interceptInit before other directives on the wrapper.
  }).before("ignore");
}
