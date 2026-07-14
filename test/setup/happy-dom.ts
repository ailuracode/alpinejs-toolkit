/**
 * Minimal happy-dom setup: DOM reset, singleton cleanup, and fetch guard.
 *
 * Match-media and observer polyfills are opt-in via `test/setup/match-media.ts`
 * and `test/setup/observers.ts` so projects that do not need them avoid the
 * per-test reset overhead.
 */
import "./dom-reset.js";
import "./singleton-cleanup.js";
import "./fetch-stub.js";
