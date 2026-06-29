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
  _x_ignoreSelf?: boolean;
};

function warnChild(message: string): void {
  // biome-ignore lint/suspicious/noConsole: intentional developer warnings for invalid markup
  console.warn(message);
}

/** Alpine.js plugin. Registers the `x-child` directive (asChild-style unwrapping). */
export default function childPlugin(Alpine: AlpineType.Alpine): void {
  Alpine.addInitSelector(() => `[${Alpine.prefixed("child")}]`);

  Alpine.interceptInit((el, skip) => {
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

    transferAttributes(el, target, config.mode);

    Alpine.mutateDom(() => {
      el.replaceWith(target);
    });

    clearTransferredAttributes(el);
    processedWrappers.add(el);
    (el as AlpineElement)._x_ignoreSelf = true;
    skip();

    Alpine.nextTick(() => {
      Alpine.initTree(target as HTMLElement);
    });
  });

  Alpine.directive("child", () => {
    // Unwrap runs in interceptInit before other directives on the wrapper.
  }).before("ignore");
}
