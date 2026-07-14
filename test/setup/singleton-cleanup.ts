import { clearAllSingletons } from "@ailuracode/alpine-core";
import { afterEach } from "vitest";

afterEach(() => {
  clearAllSingletons();
});
