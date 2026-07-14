/**
 * Vitest setup for `@ailuracode/alpine-theme`.
 *
 * Installs a controllable `matchMedia` polyfill on `window` so the
 * system observer can be exercised deterministically. jsdom does NOT
 * ship `matchMedia`; the package must work under both the real API and
 * the test stub.
 *
 * Resets `localStorage` between tests so persisted values do not leak.
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
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
});

afterAll(() => {
  restore();
});
