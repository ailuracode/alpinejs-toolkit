/** Clamps a numeric value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Normalizes media duration values that may be NaN or Infinity. */
export function sanitizeDuration(value: number): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, value);
}

/** Normalizes media currentTime values that may be NaN. */
export function sanitizeTime(value: number): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, value);
}

/** Clamps a seek target to the valid range when duration is known. */
export function clampSeek(time: number, duration: number): number {
  const normalized = sanitizeTime(time);
  if (duration > 0) {
    return clamp(normalized, 0, duration);
  }
  return normalized;
}

/** Clamps volume to the native media element range. */
export function clampVolume(volume: number): number {
  return clamp(volume, 0, 1);
}
