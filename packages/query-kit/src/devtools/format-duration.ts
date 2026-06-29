/** Formats a request duration for devtools labels. */
export function formatDuration(durationMs: number | null | undefined): string {
  if (durationMs === null || durationMs === undefined || durationMs < 0) {
    return "—";
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }

  return `${(durationMs / 1000).toFixed(2)}s`;
}
