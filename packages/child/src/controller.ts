/**
 * Framework-agnostic core of `@ailuracode/alpine-child`.
 *
 * The `x-child` directive is unusual: it owns no state, fires no events,
 * and survives without any controller lifecycle. The "controller" here
 * is therefore a thin facade over the pure helpers in
 * `./internal/transfer.ts` — the helpers ARE the framework-agnostic
 * surface, and `index.ts` re-exports them via this file.
 *
 * Construction rules (per
 * `.agents/instructions/controllers.instructions.md`):
 *
 * - Functions MUST NOT touch `window` / `document` / `Alpine.*`. They
 *   are pure logic — no browser APIs, no Alpine APIs. Alpine-only glue
 *   lives in `./plugin`.
 * - Inputs are plain DOM elements; outputs are plain values or `void`.
 *
 * The implementations live in `./internal/transfer.ts`; this file
 * exists to draw the architectural seam between framework glue
 * (`./plugin`) and framework-agnostic logic.
 */

export {
  clearTransferredAttributes,
  countElementChildren,
  findFirstElementChild,
  parseChildDirective,
  transferAttributes,
} from "./internal/transfer.js";
