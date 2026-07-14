/**
 * @fileoverview Adopted Vitest runtime settings for ALP-134.
 *
 * Centralizes pool, worker, and isolation defaults so root and package
 * projects stay aligned. Override workers locally with VITEST_MAX_WORKERS.
 */

import os from "node:os";

/** Linear issue that owns these settings. */
export const VITEST_TUNING_ISSUE = "ALP-134";

/** Tolerance multipliers for scheduled performance regression checks (ALP-135). */
export const PERFORMANCE_TOLERANCE = {
  wallMs: 1.25,
  environmentSec: 1.3,
  severeWallMs: 1.5,
};

/**
 * @returns {number}
 */
export function resolveMaxWorkers() {
  const env = process.env.VITEST_MAX_WORKERS;
  if (env !== undefined && env !== "") {
    const parsed = Number.parseInt(env, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const cpus = os.cpus().length;
  return Math.max(2, Math.min(6, Math.floor(cpus / 2)));
}

/**
 * Node project: CPU-bound transforms and imports benefit from threads.
 *
 * @returns {import('vitest/config').TestProjectConfiguration['test']}
 */
export function nodeProjectRuntimeSettings() {
  return {
    pool: "threads",
    maxWorkers: resolveMaxWorkers(),
    isolate: true,
    fileParallelism: true,
  };
}

/**
 * Simulated DOM projects: keep process isolation via forks.
 *
 * @returns {import('vitest/config').TestProjectConfiguration['test']}
 */
export function domProjectRuntimeSettings() {
  return {
    pool: "forks",
    maxWorkers: resolveMaxWorkers(),
    isolate: true,
    fileParallelism: true,
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function runtimeSettingsSnapshot() {
  return {
    issue: VITEST_TUNING_ISSUE,
    maxWorkers: resolveMaxWorkers(),
    node: {
      pool: "threads",
      isolate: true,
      fileParallelism: true,
    },
    dom: {
      pool: "forks",
      isolate: true,
      fileParallelism: true,
    },
    rejected: [
      {
        setting: "isolate: false on node project",
        reason:
          "40+ failures on first run and 25+ on rerun — singleton cleanup is not sufficient for shared module state.",
      },
      {
        setting: "pool: vmThreads",
        reason:
          "Not benchmarked — forks/threads covered the measured workspace gains without VM pool risk.",
      },
      {
        setting: "deps.optimizer",
        reason:
          "No measurable warm-run gain after project split; adds transform-cache complexity across seven overlay configs.",
      },
    ],
  };
}
