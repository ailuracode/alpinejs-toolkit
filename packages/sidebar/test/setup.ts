/**
 * Vitest setup for `@ailuracode/alpine-sidebar`.
 *
 * Installs a controllable `matchMedia` polyfill on `window` so the
 * breakpoint observer can be exercised deterministically.
 *
 * Resets `documentElement` attributes between tests so persisted
 * `data-sidebar` markers from a previous case do not leak.
 */

import { afterAll, beforeEach } from "vitest";
import {
  getMatchMedia,
  installMatchMediaMock,
  installWindowMatchMedia,
  resetMatchMedia,
  setMatchMedia,
} from "../../../test/setup/match-media.js";
import "../../../test/setup/singleton-cleanup.js";

export { getMatchMedia, installMatchMediaMock, setMatchMedia };

const { restore } = installWindowMatchMedia();

beforeEach(() => {
  resetMatchMedia();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-sidebar");
});

afterAll(() => {
  restore();
});
