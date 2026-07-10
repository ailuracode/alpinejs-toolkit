/**
 * Public entrypoint for `@ailuracode/alpine-transfer`.
 *
 * Re-exports only. Implementation lives in `./plugin.ts` and
 * transfer modules under `./clipboard.ts`, `./share.ts`, and
 * `./export.ts`.
 */

export * from "./plugin.js";
export { default } from "./plugin.js";
