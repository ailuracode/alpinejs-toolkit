import { describe, expect, it } from "vitest";
import { resolveMaxWorkers, runtimeSettingsSnapshot } from "../scripts/vitest-runtime-settings.mjs";

describe("vitest runtime settings", () => {
  it("caps max workers between 2 and 6 based on CPU count", () => {
    const workers = resolveMaxWorkers();
    expect(workers).toBeGreaterThanOrEqual(2);
    expect(workers).toBeLessThanOrEqual(6);
  });

  it("records adopted and rejected tuning decisions", () => {
    const snapshot = runtimeSettingsSnapshot() as {
      node: { pool: string };
      dom: { pool: string };
      rejected: Array<{ setting: string }>;
    };
    expect(snapshot.node.pool).toBe("threads");
    expect(snapshot.dom.pool).toBe("forks");
    expect(snapshot.rejected.some((entry) => entry.setting.includes("isolate: false"))).toBe(true);
  });
});
