import type { KeyboardOptions } from "./types.js";

export const DEFAULT_KEYBOARD_SCOPE = "global";
export const DEFAULT_SEQUENCE_TIMEOUT = 1_000;

const DEFAULT_EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';

export interface NormalizedKeyboardOptions {
  readonly sequenceTimeout: number;
  readonly ignoreEditableTargets: boolean;
  readonly editableSelector: string;
  readonly pauseWhileScopesActive: readonly string[];
}

/** Normalizes keyboard controller options once at construction. */
export function normalizeKeyboardOptions(options: KeyboardOptions = {}): NormalizedKeyboardOptions {
  return {
    sequenceTimeout: options.sequenceTimeout ?? DEFAULT_SEQUENCE_TIMEOUT,
    ignoreEditableTargets: options.ignoreEditableTargets !== false,
    editableSelector: options.editableSelector ?? DEFAULT_EDITABLE_SELECTOR,
    pauseWhileScopesActive: options.pauseWhileScopesActive ?? [],
  };
}
