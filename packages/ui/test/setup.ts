/**
 * Vitest setup for `@ailuracode/alpine-ui`.
 *
 * happy-dom overlay project setup — DOM reset and singleton cleanup only.
 * Individual specs install their own matchMedia stubs when needed.
 */

import "../../../test/setup/dom-reset.js";
import "../../../test/setup/singleton-cleanup.js";
import "../../../test/setup/fetch-stub.js";
