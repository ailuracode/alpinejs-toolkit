/**
 * Build configuration for `@ailuracode/alpine-realtime`.
 *
 * Mirrors the canonical repo pattern: ESM + CJS + type
 * definitions, peer dependencies externalized so consumers
 * receive them from the same version their Alpine app already
 * has.
 *
 * The package ships:
 * - `index` — headless surface (types, errors, controller,
 *   adapters, utilities).
 * - `controller` — the `RealtimeController` and its companion
 *   factories (no adapters, no plugin).
 * - `adapters` — SSE / WebSocket adapter implementations and
 *   the factory helpers (`createAutoTransport`,
 *   `createSseTransport`, etc.).
 * - `alpine` — the `realtimePlugin` factory and the
 *   `$store.realtime` / `$realtime` types.
 * - `test` — mock transport and config fixtures for consumers
 *   that write their own tests.
 */
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    controller: "src/controller/index.ts",
    adapters: "src/adapters/index.ts",
    alpine: "src/alpine/index.ts",
    plugin: "src/plugin/index.ts",
    test: "src/test/mocks.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  minify: true,
  sourcemap: false,
  external: ["alpinejs", "@types/alpinejs", "@ailuracode/alpine-core"],
});
