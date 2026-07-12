import { KeyboardError } from "./errors.js";
import type { ParsedChord, ParsedChordModifiers } from "./types.js";

const SPECIAL_KEY_ALIASES: Readonly<Record<string, string>> = {
  esc: "escape",
  return: "enter",
  space: " ",
  spacebar: " ",
  del: "delete",
  ins: "insert",
  left: "arrowleft",
  right: "arrowright",
  up: "arrowup",
  down: "arrowdown",
  pageup: "pageup",
  pagedown: "pagedown",
};

const MODIFIER_ALIASES: Readonly<Record<string, keyof ParsedChordModifiers>> = {
  control: "ctrl",
  cmd: "meta",
  command: "meta",
  option: "alt",
};

function normalizeKeyToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new KeyboardError("Shortcut key token cannot be empty", "KEYBOARD_INVALID_SHORTCUT");
  }

  const lower = trimmed.toLowerCase();
  const alias = SPECIAL_KEY_ALIASES[lower];
  if (alias) {
    return alias;
  }

  if (lower.length === 1) {
    return lower;
  }

  return lower;
}

function parseChordPart(part: string): ParsedChord {
  const tokens = part
    .split("+")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    throw new KeyboardError(`Invalid shortcut chord "${part}"`, "KEYBOARD_INVALID_SHORTCUT");
  }

  const modifiers: ParsedChordModifiers = {
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
    mod: false,
  };

  let keyToken: string | undefined;

  for (const token of tokens) {
    const lower = token.toLowerCase();
    const modifierKey = (MODIFIER_ALIASES[lower] ?? lower) as keyof ParsedChordModifiers;

    if (modifierKey in modifiers) {
      modifiers[modifierKey] = true;
      continue;
    }

    if (keyToken) {
      throw new KeyboardError(
        `Shortcut chord "${part}" has multiple key tokens`,
        "KEYBOARD_INVALID_SHORTCUT"
      );
    }

    keyToken = token;
  }

  if (!keyToken) {
    throw new KeyboardError(
      `Shortcut chord "${part}" is missing a key`,
      "KEYBOARD_INVALID_SHORTCUT"
    );
  }

  return {
    modifiers,
    key: normalizeKeyToken(keyToken),
  };
}

/**
 * Parses shortcut strings such as `mod+k`, `ctrl+shift+s`, and sequences `g h`.
 * Space-separated tokens denote multi-key sequences; `+` joins modifiers to a key.
 */
export function parseShortcut(shortcut: string): readonly ParsedChord[] {
  const normalized = shortcut.trim().replace(/\s+/g, " ");
  if (!normalized) {
    throw new KeyboardError("Shortcut cannot be empty", "KEYBOARD_INVALID_SHORTCUT");
  }

  const parts = normalized.split(" ");
  return parts.map((part) => parseChordPart(part));
}

/** Formats parsed chords back into a canonical shortcut label. */
export function formatShortcut(chords: readonly ParsedChord[]): string {
  return chords
    .map((chord) => {
      const modifiers: string[] = [];
      if (chord.modifiers.mod) {
        modifiers.push("mod");
      }
      if (chord.modifiers.ctrl) {
        modifiers.push("ctrl");
      }
      if (chord.modifiers.meta) {
        modifiers.push("meta");
      }
      if (chord.modifiers.alt) {
        modifiers.push("alt");
      }
      if (chord.modifiers.shift) {
        modifiers.push("shift");
      }

      const keyLabel = chord.key === " " ? "space" : chord.key;
      return [...modifiers, keyLabel].join("+");
    })
    .join(" ");
}
