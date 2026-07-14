import { BaseController, generateId, isBrowser, safeWindow } from "@ailuracode/alpine-core";
import { isEditableTarget } from "./editable.js";
import { KeyboardError } from "./errors.js";
import type { KeyboardEvents } from "./events.js";
import { chordMatchesEvent, isMacPlatform, readChordFromEvent } from "./match.js";
import {
  DEFAULT_KEYBOARD_SCOPE,
  type NormalizedKeyboardOptions,
  normalizeKeyboardOptions,
} from "./options.js";
import { formatShortcut, parseShortcut } from "./parse.js";
import type {
  InternalRegistration,
  KeyboardOptions,
  ParsedChord,
  ShortcutHandler,
  ShortcutRegistration,
  ShortcutRegistrationOptions,
  ShortcutScope,
} from "./types.js";

interface SequenceState {
  readonly registrationId: string;
  readonly chords: readonly ParsedChord[];
  readonly buffer: ParsedChord[];
}

/**
 * Framework-agnostic keyboard shortcut registry with scoped activation,
 * chord and sequence matching, and conflict resolution by priority.
 */
export class KeyboardController extends BaseController<KeyboardEvents> {
  readonly #options: NormalizedKeyboardOptions;
  readonly #registrations = new Map<string, InternalRegistration>();
  readonly #activeScopes = new Set<ShortcutScope>([DEFAULT_KEYBOARD_SCOPE]);
  readonly #suspendedScopes = new Set<ShortcutScope>();
  readonly #isMac: boolean;

  #listenerTarget: Window | null = null;
  #keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  #sequenceState: SequenceState | null = null;
  #sequenceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: KeyboardOptions = {}, isMac?: boolean) {
    super(generateId("keyboard"));
    this.#options = normalizeKeyboardOptions(options);
    this.#isMac = isMac ?? isMacPlatform();
  }

  get activeScopes(): readonly ShortcutScope[] {
    return [...this.#activeScopes];
  }

  get suspendedScopes(): readonly ShortcutScope[] {
    return [...this.#suspendedScopes];
  }

  get commands(): readonly ShortcutRegistration[] {
    return [...this.#registrations.values()].map((registration) =>
      this.#toPublicRegistration(registration)
    );
  }

  register(
    shortcut: string,
    handler: ShortcutHandler,
    options: ShortcutRegistrationOptions = {}
  ): () => void {
    if (this.isDestroyed) {
      throw new KeyboardError("Cannot register shortcut after destroy()", "KEYBOARD_DESTROYED");
    }

    const chords = parseShortcut(shortcut);
    const id = options.id ?? generateId("shortcut");
    if (this.#registrations.has(id)) {
      throw new KeyboardError(`Shortcut id "${id}" is already registered`, "KEYBOARD_DUPLICATE_ID");
    }

    const scopes = normalizeScopes(options.scope);
    const registration: InternalRegistration = {
      id,
      shortcut: formatShortcut(chords),
      chords,
      scopes,
      priority: options.priority ?? 0,
      enabled: options.enabled !== false,
      allowInEditable: options.allowInEditable === true,
      preventDefault: options.preventDefault !== false,
      stopPropagation: options.stopPropagation === true,
      label: options.metadata?.label,
      description: options.metadata?.description,
      group: options.metadata?.group,
      when: options.when,
      handler,
    };

    this.#registrations.set(id, registration);
    this.#resolveConflicts(registration);

    return () => {
      this.unregister(id);
    };
  }

  unregister(id: string): boolean {
    if (this.#sequenceState?.registrationId === id) {
      this.#clearSequence();
    }

    return this.#registrations.delete(id);
  }

  activateScope(scope: ShortcutScope): void {
    this.#assertScope(scope);
    this.#activeScopes.add(scope);
    this.#emitScopeChange();
  }

  deactivateScope(scope: ShortcutScope): void {
    if (scope === DEFAULT_KEYBOARD_SCOPE) {
      return;
    }

    this.#activeScopes.delete(scope);
    this.#emitScopeChange();
  }

  suspendScope(scope: ShortcutScope): void {
    this.#assertScope(scope);
    this.#suspendedScopes.add(scope);
    this.#emitScopeChange();
  }

  resumeScope(scope: ShortcutScope): void {
    this.#suspendedScopes.delete(scope);
    this.#emitScopeChange();
  }

  isScopeActive(scope: ShortcutScope): boolean {
    return this.#activeScopes.has(scope);
  }

  isScopeSuspended(scope: ShortcutScope): boolean {
    return this.#suspendedScopes.has(scope);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.isDestroyed) {
      return;
    }

    const editable =
      this.#options.ignoreEditableTargets &&
      isEditableTarget(event, this.#options.editableSelector);

    const completed = this.#tryCompleteSequence(event, editable);
    if (completed) {
      return;
    }

    const singles = this.#getSingleChordMatches(event, editable);
    if (singles.length > 0) {
      this.#dispatchRegistration(singles[0], event);
      return;
    }

    const sequenceStarter = this.#getSequenceStarter(event, editable);
    if (sequenceStarter) {
      this.#setSequence({
        registrationId: sequenceStarter.id,
        chords: sequenceStarter.chords,
        buffer: [readChordFromEvent(event)],
      });
    }
  }

  override mount(): void {
    if (this.isMounted || this.isDestroyed) {
      super.mount();
      return;
    }

    super.mount();

    if (!isBrowser()) {
      return;
    }

    const target = safeWindow();
    if (!target || this.#keydownHandler) {
      return;
    }

    this.#listenerTarget = target;
    this.#keydownHandler = (event: KeyboardEvent) => {
      this.handleKeydown(event);
    };

    target.addEventListener("keydown", this.#keydownHandler);
    this.registerCleanup(() => {
      if (this.#listenerTarget && this.#keydownHandler) {
        this.#listenerTarget.removeEventListener("keydown", this.#keydownHandler);
      }
      this.#listenerTarget = null;
      this.#keydownHandler = null;
    });
  }

  override destroy(): void {
    this.#clearSequence();
    this.#registrations.clear();
    this.#activeScopes.clear();
    this.#activeScopes.add(DEFAULT_KEYBOARD_SCOPE);
    this.#suspendedScopes.clear();
    super.destroy();
  }

  #tryCompleteSequence(event: KeyboardEvent, editable: boolean): boolean {
    if (!this.#sequenceState) {
      return false;
    }

    const registration = this.#registrations.get(this.#sequenceState.registrationId);
    if (!(registration && this.#isRegistrationEligible(registration, editable))) {
      this.#clearSequence();
      return false;
    }

    const nextChord = registration.chords[this.#sequenceState.buffer.length];
    if (!(nextChord && chordMatchesEvent(nextChord, event, this.#isMac))) {
      this.#clearSequence();
      return false;
    }

    const nextBuffer = [...this.#sequenceState.buffer, readChordFromEvent(event)];
    if (nextBuffer.length < registration.chords.length) {
      this.#setSequence({
        registrationId: registration.id,
        chords: registration.chords,
        buffer: nextBuffer,
      });
      return true;
    }

    this.#clearSequence();
    this.#dispatchRegistration(registration, event);
    return true;
  }

  #getSingleChordMatches(event: KeyboardEvent, editable: boolean): InternalRegistration[] {
    const matches: InternalRegistration[] = [];

    for (const registration of this.#registrations.values()) {
      if (registration.chords.length !== 1) {
        continue;
      }
      if (!this.#isRegistrationEligible(registration, editable)) {
        continue;
      }

      const chord = registration.chords[0];
      if (chord && chordMatchesEvent(chord, event, this.#isMac)) {
        matches.push(registration);
      }
    }

    return matches.sort((left, right) => right.priority - left.priority);
  }

  #getSequenceStarter(event: KeyboardEvent, editable: boolean): InternalRegistration | undefined {
    const starters: InternalRegistration[] = [];

    for (const registration of this.#registrations.values()) {
      if (registration.chords.length < 2) {
        continue;
      }
      if (!this.#isRegistrationEligible(registration, editable)) {
        continue;
      }

      const firstChord = registration.chords[0];
      if (firstChord && chordMatchesEvent(firstChord, event, this.#isMac)) {
        starters.push(registration);
      }
    }

    return starters.sort((left, right) => right.priority - left.priority)[0];
  }

  #isRegistrationEligible(registration: InternalRegistration, editable: boolean): boolean {
    if (!registration.enabled) {
      return false;
    }
    if (editable && !registration.allowInEditable) {
      return false;
    }
    if (registration.when && !registration.when()) {
      return false;
    }

    return this.#registrationScopeMatches(registration);
  }

  #dispatchRegistration(registration: InternalRegistration, event: KeyboardEvent): void {
    if (registration.preventDefault) {
      event.preventDefault();
    }
    if (registration.stopPropagation) {
      event.stopPropagation();
    }

    registration.handler(event);
    this.emit("trigger", {
      registration: this.#toPublicRegistration(registration),
      event,
    });
  }

  #registrationScopeMatches(registration: InternalRegistration): boolean {
    const matchingScopes = registration.scopes.filter(
      (scope) => this.#activeScopes.has(scope) && !this.#suspendedScopes.has(scope)
    );

    if (matchingScopes.length === 0) {
      return false;
    }

    const onlyGlobal = matchingScopes.length === 1 && matchingScopes[0] === DEFAULT_KEYBOARD_SCOPE;

    if (onlyGlobal && this.#shouldPauseGlobalScope()) {
      return false;
    }

    return true;
  }

  #shouldPauseGlobalScope(): boolean {
    if (this.#options.pauseWhileScopesActive.length === 0) {
      return false;
    }

    return this.#options.pauseWhileScopesActive.some(
      (scope) => this.#activeScopes.has(scope) && !this.#suspendedScopes.has(scope)
    );
  }

  #resolveConflicts(registration: InternalRegistration): void {
    for (const existing of this.#registrations.values()) {
      if (existing.id === registration.id) {
        continue;
      }
      if (existing.shortcut !== registration.shortcut) {
        continue;
      }

      const sharedScope = existing.scopes.find((scope) => registration.scopes.includes(scope));
      if (!sharedScope) {
        continue;
      }

      const winner = existing.priority >= registration.priority ? existing : registration;
      const loser = winner.id === existing.id ? registration : existing;

      this.emit("conflict", {
        winnerId: winner.id,
        loserId: loser.id,
        shortcut: registration.shortcut,
        scope: sharedScope,
      });
    }
  }

  #setSequence(state: SequenceState): void {
    this.#clearSequenceTimer();
    this.#sequenceState = state;
    this.#sequenceTimer = setTimeout(() => {
      this.#clearSequence();
    }, this.#options.sequenceTimeout);
  }

  #clearSequence(): void {
    this.#clearSequenceTimer();
    this.#sequenceState = null;
  }

  #clearSequenceTimer(): void {
    if (this.#sequenceTimer) {
      clearTimeout(this.#sequenceTimer);
      this.#sequenceTimer = null;
    }
  }

  #emitScopeChange(): void {
    this.emit("scopeChange", {
      activeScopes: this.activeScopes,
      suspendedScopes: this.suspendedScopes,
    });
  }

  #assertScope(scope: ShortcutScope): void {
    if (!scope.trim()) {
      throw new KeyboardError("Scope name cannot be empty", "KEYBOARD_UNKNOWN_SCOPE");
    }
  }

  #toPublicRegistration(registration: InternalRegistration): ShortcutRegistration {
    return {
      id: registration.id,
      shortcut: registration.shortcut,
      scopes: registration.scopes,
      priority: registration.priority,
      enabled: registration.enabled,
      allowInEditable: registration.allowInEditable,
      preventDefault: registration.preventDefault,
      stopPropagation: registration.stopPropagation,
      label: registration.label,
      description: registration.description,
      group: registration.group,
    };
  }
}

/** Creates a {@link KeyboardController} and mounts global listeners when in a browser. */
export function createKeyboard(options: KeyboardOptions = {}): KeyboardController {
  const controller = new KeyboardController(options);
  controller.mount();
  return controller;
}

function normalizeScopes(
  scope: ShortcutScope | readonly ShortcutScope[] | undefined
): readonly ShortcutScope[] {
  if (!scope) {
    return [DEFAULT_KEYBOARD_SCOPE];
  }

  if (typeof scope === "string") {
    return [scope];
  }

  if (scope.length === 0) {
    return [DEFAULT_KEYBOARD_SCOPE];
  }

  return [...scope];
}

export type { KeyboardOptions, ShortcutRegistration, ShortcutRegistrationOptions, ShortcutScope };
