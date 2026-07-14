/**
 * Backward-compatible barrel for tests that import setup helpers directly.
 *
 * New Vitest projects should compose modules from `test/setup/` instead of
 * importing this file as a setupFile.
 */
export {
  getMatchMedia,
  installGlobalMatchMedia,
  installMatchMediaMock,
  installWindowMatchMedia,
  resetMatchMedia,
  setMatchMedia,
} from "./setup/match-media.js";
