import type { KeyboardController } from "./controller.js";

export type ShortcutScope = string;

export interface ShortcutMetadata {
  readonly id: string;
  readonly label?: string;
  readonly description?: string;
  readonly group?: string;
}

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface ShortcutRegistrationOptions {
  readonly id?: string;
  readonly scope?: ShortcutScope | readonly ShortcutScope[];
  readonly priority?: number;
  readonly enabled?: boolean;
  readonly allowInEditable?: boolean;
  readonly preventDefault?: boolean;
  readonly stopPropagation?: boolean;
  readonly metadata?: Omit<ShortcutMetadata, "id">;
  readonly when?: () => boolean;
}

export interface ShortcutRegistration extends ShortcutMetadata {
  readonly shortcut: string;
  readonly scopes: readonly ShortcutScope[];
  readonly priority: number;
  readonly enabled: boolean;
  readonly allowInEditable: boolean;
  readonly preventDefault: boolean;
  readonly stopPropagation: boolean;
}

export interface KeyboardOptions {
  readonly sequenceTimeout?: number;
  readonly ignoreEditableTargets?: boolean;
  readonly editableSelector?: string;
  readonly pauseWhileScopesActive?: readonly ShortcutScope[];
}

export interface KeyboardPluginOptions {
  readonly controller?: KeyboardController;
  readonly options?: KeyboardOptions;
  readonly shortcuts?: readonly KeyboardShortcutDefinition[];
  /**
   * `$store` key the Alpine plugin registers under. Defaults to
   * {@link DEFAULT_KEYBOARD_STORE_KEY}. Set when the host already
   * owns a `keyboard` store or another toolkit plugin would collide
   * on that name — the rename avoids the collision without touching
   * the controller. Ignored by the standalone `createKeyboard`.
   */
  readonly storeKey?: string;
  /**
   * `$keyboard` magic key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_KEYBOARD_MAGIC_KEY}, or to `storeKey`
   * when that is renamed (the magic follows the store so consumers
   * only rename one). Ignored by the standalone factory.
   */
  readonly magicKey?: string;
}

/** Default `$store` key registered by {@link keyboardPlugin}. */
export const DEFAULT_KEYBOARD_STORE_KEY = "keyboard";

/** Default `$keyboard` magic key registered by {@link keyboardPlugin}. */
export const DEFAULT_KEYBOARD_MAGIC_KEY = "keyboard";

export interface KeyboardShortcutDefinition {
  readonly shortcut: string;
  readonly handler: ShortcutHandler;
  readonly options?: ShortcutRegistrationOptions;
}

export interface KeyboardMagic {
  readonly activeScopes: readonly ShortcutScope[];
  readonly suspendedScopes: readonly ShortcutScope[];
  readonly commands: readonly ShortcutRegistration[];
  register(
    shortcut: string,
    handler: ShortcutHandler,
    options?: ShortcutRegistrationOptions
  ): () => void;
  unregister(id: string): boolean;
  activateScope(scope: ShortcutScope): void;
  deactivateScope(scope: ShortcutScope): void;
  suspendScope(scope: ShortcutScope): void;
  resumeScope(scope: ShortcutScope): void;
  isScopeActive(scope: ShortcutScope): boolean;
  isScopeSuspended(scope: ShortcutScope): boolean;
  handleKeydown(event: KeyboardEvent): void;
}

export interface KeyboardStore extends KeyboardMagic {}

export interface ParsedChordModifiers {
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  mod: boolean;
}

export interface ParsedChord {
  readonly modifiers: ParsedChordModifiers;
  readonly key: string;
}

export interface InternalRegistration extends ShortcutRegistration {
  readonly chords: readonly ParsedChord[];
  readonly when?: () => boolean;
  readonly handler: ShortcutHandler;
}
