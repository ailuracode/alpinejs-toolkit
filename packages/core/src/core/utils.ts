/**
 * Type guard for `typeof value === type`.
 */
export const typeIs = (value: unknown, type: string) => typeof value === type;

/**
 * Returns `value` when `condition` is truthy, otherwise `null`.
 */
export const valueIf = <T>(condition: boolean, value: T, fallback: T | null = null): T | null =>
  condition ? value : fallback;
