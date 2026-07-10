/**
 * Generic storage adapter factories shared across the toolkit.
 *
 * Each factory returns a {@link import("../types").StorageAdapter}
 * whose value type is pinned by the caller. Feature packages
 * (`@ailuracode/alpine-theme`, `@ailuracode/alpine-sidebar`,
 * `@ailuracode/alpine-query-kit`, …) compose these factories into
 * their own typed adapters instead of re-deriving the SSR-safe
 * read / write / subscribe dance from scratch.
 */

export { createLocalStorageAdapter } from "./local-storage";
export { createMemoryAdapter } from "./memory-storage";
