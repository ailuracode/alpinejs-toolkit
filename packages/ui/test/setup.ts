/**
 * Vitest setup for `@ailuracode/alpine-ui`.
 *
 * jsdom overlay project setup — DOM reset and singleton cleanup only.
 * Individual specs install their own matchMedia stubs when needed.
 */

import "../../../test/setup/jsdom-base.js";
