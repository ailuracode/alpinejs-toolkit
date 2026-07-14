/**
 * Vitest setup for `@ailuracode/alpine-media`.
 *
 * Installs a controllable `matchMedia` polyfill on `window` so the
 * controller can be exercised deterministically when the package runs
 * in isolation (`pnpm --filter ...`).
 */

import { afterAll, beforeEach } from "vitest";
import {
  getMatchMedia,
  installWindowMatchMedia,
  resetMatchMedia,
  setMatchMedia,
} from "../../../test/setup/match-media.js";
import "../../../test/setup/singleton-cleanup.js";

export { getMatchMedia, setMatchMedia };

const { restore } = installWindowMatchMedia();

beforeEach(() => {
  resetMatchMedia();
  localStorage.clear();
});

afterAll(() => {
  restore();
});
