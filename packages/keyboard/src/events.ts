import type { ShortcutRegistration } from "./types.js";

export interface KeyboardEvents extends Record<string, unknown> {
  trigger: {
    registration: ShortcutRegistration;
    event: KeyboardEvent;
  };
  conflict: {
    winnerId: string;
    loserId: string;
    shortcut: string;
    scope: string;
  };
  scopeChange: {
    activeScopes: readonly string[];
    suspendedScopes: readonly string[];
  };
}
