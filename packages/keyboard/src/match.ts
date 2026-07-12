import type { ParsedChord, ParsedChordModifiers } from "./types.js";

const MAC_PLATFORM_PATTERN = /mac|iphone|ipad|ipod/i;

let cachedIsMac: boolean | undefined;

/** Detects macOS / iOS platforms for `mod` normalization. SSR-safe. */
export function isMacPlatform(navigatorLike?: { platform?: string; userAgent?: string }): boolean {
  if (navigatorLike) {
    const platform = navigatorLike.platform ?? "";
    const userAgent = navigatorLike.userAgent ?? "";
    return MAC_PLATFORM_PATTERN.test(platform) || MAC_PLATFORM_PATTERN.test(userAgent);
  }

  if (cachedIsMac !== undefined) {
    return cachedIsMac;
  }

  if (typeof navigator === "undefined") {
    return false;
  }

  cachedIsMac =
    MAC_PLATFORM_PATTERN.test(navigator.platform) || MAC_PLATFORM_PATTERN.test(navigator.userAgent);
  return cachedIsMac;
}

/** Resets cached platform detection — for tests only. */
export function resetMacPlatformCache(): void {
  cachedIsMac = undefined;
}

function normalizeEventKey(key: string): string {
  if (key === " ") {
    return " ";
  }

  if (key.length === 1) {
    return key.toLowerCase();
  }

  return key.toLowerCase();
}

function readChordFromEvent(event: KeyboardEvent): ParsedChord {
  return {
    modifiers: {
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      alt: event.altKey,
      shift: event.shiftKey,
      mod: false,
    },
    key: normalizeEventKey(event.key),
  };
}

function modifierSatisfied(
  expected: ParsedChordModifiers,
  actual: ParsedChordModifiers,
  isMac: boolean
): boolean {
  const ctrl = expected.ctrl || (expected.mod && !isMac);
  const meta = expected.meta || (expected.mod && isMac);

  if (ctrl !== actual.ctrl) {
    return false;
  }
  if (meta !== actual.meta) {
    return false;
  }
  if (expected.alt !== actual.alt) {
    return false;
  }
  if (expected.shift !== actual.shift) {
    return false;
  }

  return true;
}

/** Returns true when a keyboard event matches a parsed chord. */
export function chordMatchesEvent(
  chord: ParsedChord,
  event: KeyboardEvent,
  isMac = isMacPlatform()
): boolean {
  const actual = readChordFromEvent(event);
  if (chord.key !== actual.key) {
    return false;
  }

  return modifierSatisfied(chord.modifiers, actual.modifiers, isMac);
}

/** Returns true when the event chord equals the next step in a sequence buffer. */
export function sequenceStepMatches(
  chords: readonly ParsedChord[],
  buffer: readonly ParsedChord[],
  event: KeyboardEvent,
  isMac = isMacPlatform()
): boolean {
  const nextIndex = buffer.length;
  if (nextIndex >= chords.length) {
    return false;
  }

  return chordMatchesEvent(chords[nextIndex], event, isMac);
}

export { normalizeEventKey, readChordFromEvent };
