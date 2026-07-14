/**
 * Exponential backoff with multiplicative jitter.
 *
 * The module exposes a single pure function — `calculateBackoff` —
 * that computes the delay (milliseconds) to wait before the next
 * reconnect attempt. The algorithm follows the "equal jitter"
 * strategy described in the AWS Architecture Blog:
 *
 * ```text
 *   raw   = min(maxDelayMs, baseDelayMs * 2^attempt)
 *   final = raw * (1 - jitterFactor + 2 * jitterFactor * random())
 * ```
 *
 * `jitterFactor = 0` is deterministic; `jitterFactor = 0.5` spreads
 * the result across `[0.5x, 1.5x] raw`; `jitterFactor = 1` covers
 * `[0x, 2x] raw` ("full jitter").
 *
 * The `random` source is injectable so tests can assert monotonic
 * behaviour deterministically. Modules that need a real jitter
 * during production pass nothing and rely on `Math.random`.
 *
 * @module
 */

/**
 * Configuration consumed by {@link calculateBackoff}.
 *
 * Values are validated at the call site; this module does not throw
 * — invalid inputs (`negative attempt`, `NaN`, `jitterFactor < 0`)
 * are clamped to safe ranges so a misconfigured consumer never
 * crashes a retry loop.
 */
export interface BackoffConfig {
  /** Initial delay. Must be `> 0`; defaults to `1` when non-positive. */
  readonly baseDelayMs: number;
  /** Cap on the computed delay. Must be `>= baseDelayMs`. */
  readonly maxDelayMs: number;
  /**
   * Multiplicative jitter applied to the raw cap. `0` means
   * deterministic; `1` means random in `[0, 2 * raw]`.
   */
  readonly jitterFactor: number;
}

/** Default options for {@link calculateBackoff}. */
export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = Object.freeze({
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitterFactor: 0.5,
});

/**
 * Computes the delay before the next reconnect attempt.
 *
 * Negative attempts and non-positive `baseDelayMs` are clamped to
 * `0` and `1` respectively. `maxDelayMs` below `baseDelayMs` is
 * lifted to `baseDelayMs` so the cap never shrinks the base.
 *
 * @param attempt Zero-based retry count (`0` is the first retry).
 * @param config  Backoff parameters.
 * @param random  Optional RNG; defaults to {@link Math.random}.
 * @returns Delay in milliseconds (always `>= 0`, integer).
 */
export function calculateBackoff(
  attempt: number,
  config: BackoffConfig,
  random: () => number = Math.random
): number {
  const safeAttempt = Math.max(0, Math.floor(Number.isFinite(attempt) ? attempt : 0));
  const baseDelay = config.baseDelayMs > 0 ? config.baseDelayMs : 1;
  const maxDelay = Math.max(config.maxDelayMs, baseDelay);
  const jitter = clampJitter(config.jitterFactor);
  const safeRandom = clampRandom(random);

  // `2 ** attempt` overflows for very large attempts; cap at the
  // value where `baseDelay * 2^attempt` would exceed `maxDelay`
  // comfortably. Floating-point growth at >1024 attempts could
  // even reach `Infinity` for extreme inputs.
  const raw = Math.min(maxDelay, baseDelay * 2 ** clampToPow2Range(safeAttempt));
  const window = raw * jitter * 2;
  const offset = jitter <= 0 ? raw : raw * (1 - jitter) + window * safeRandom();
  return Math.max(0, Math.floor(offset));
}

function clampJitter(jitterFactor: number): number {
  if (!Number.isFinite(jitterFactor)) {
    return 0;
  }
  return Math.min(1, Math.max(0, jitterFactor));
}

function clampRandom(random: () => number): () => number {
  try {
    const sample = random();
    if (typeof sample === "number" && Number.isFinite(sample)) {
      return random;
    }
    return Math.random;
  } catch {
    return Math.random;
  }
}

function clampToPow2Range(attempt: number): number {
  // `2^attempt` overflows past attempt=1023 in float64. Cap so we
  // stay well within IEEE-754 representable integers.
  return Math.min(1023, attempt);
}
