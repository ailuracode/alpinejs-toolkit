import { describe, expect, it } from "vitest";
import { evaluatePerformanceRegression } from "../scripts/vitest-performance-check.mjs";
import {
  PERFORMANCE_TOLERANCE,
  resolveMaxWorkers,
  runtimeSettingsSnapshot,
} from "../scripts/vitest-runtime-settings.mjs";

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

describe("vitest performance check", () => {
  const baseline = {
    workspace: {
      test: {
        warm: {
          wallMs: { median: 50_000 },
          timingBreakdownSec: { environment: 40 },
        },
      },
    },
  };

  it("passes when current run matches baseline", () => {
    const evaluation = evaluatePerformanceRegression(baseline, {
      wallMs: 49_000,
      timingBreakdownSec: { environment: 39 },
      success: true,
    });

    expect(evaluation.status).toBe("pass");
    expect(evaluation.failures).toHaveLength(0);
  });

  it("warns on moderate wall-time regression", () => {
    const evaluation = evaluatePerformanceRegression(baseline, {
      wallMs: 64_000,
      timingBreakdownSec: { environment: 39 },
      success: true,
    });

    expect(evaluation.status).toBe("warn");
    expect(evaluation.warnings.length).toBeGreaterThan(0);
    expect(evaluation.failures).toHaveLength(0);
  });

  it("fails on severe wall-time regression or test failures", () => {
    const severe = evaluatePerformanceRegression(baseline, {
      wallMs: 80_000,
      timingBreakdownSec: { environment: 39 },
      success: true,
    });
    const failedTests = evaluatePerformanceRegression(baseline, {
      wallMs: 49_000,
      timingBreakdownSec: { environment: 39 },
      success: false,
    });

    expect(severe.status).toBe("fail");
    expect(failedTests.status).toBe("fail");
    expect(PERFORMANCE_TOLERANCE.severeWallMs).toBe(1.5);
  });
});
