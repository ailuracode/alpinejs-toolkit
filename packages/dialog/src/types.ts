/**
 * Public type contracts for `@ailuracode/alpine-dialog`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation. The shape IS the contract.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { ScrollStore } from "@ailuracode/alpine-scroll";
import type { Alpine as AlpineBase } from "alpinejs";

/** Options passed to `open()` at call site. */
export type DialogOpenOptions = {
  trigger?: HTMLElement | null;
  labelledBy?: string;
  describedBy?: string;
};

/** Options passed when registering a dialog instance. */
export type DialogInstanceOptions = {
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  scrollLock?: boolean;
  labelledBy?: string;
  describedBy?: string;
  onOpen?: () => void;
  onClose?: () => void;
};

/** Internal representation of a dialog instance. */
export type DialogInstance = {
  open: boolean;
  closeOnEscape: boolean;
  closeOnOutsideClick: boolean;
  scrollLock: boolean;
  labelledBy?: string;
  describedBy?: string;
  trigger: HTMLElement | null;
  container: HTMLElement | null;
  onOpen?: () => void;
  onClose?: () => void;
};

/** Discriminator for change events. */
export type DialogChangeSource = "user" | "initialization";

/** Detail payload for the `open` event. */
export interface DialogOpenDetail {
  readonly instanceId: string;
  readonly source: DialogChangeSource;
}

/** Detail payload for the `close` event. */
export interface DialogCloseDetail {
  readonly instanceId: string;
  readonly source: DialogChangeSource;
}

/** Detail payload for the `change` event (adapter sync). */
export interface DialogChangeDetail {
  readonly instanceId?: string;
}

/** Alpine-facing store surface. */
export interface DialogStore {
  /** Reactive registry — bind templates to `instances[id].open` when needed. */
  readonly instances: Record<string, DialogInstance>;
  open(id: string, options?: DialogOpenOptions): void;
  close(id: string): void;
  toggle(id: string, options?: DialogOpenOptions): void;
  isOpen(id: string): boolean;
  register(id: string, options?: DialogInstanceOptions): void;
  unregister(id: string): void;
  bindContainer(id: string, container: HTMLElement | null): void;
  handleKeydown(id: string, event: KeyboardEvent): void;
  handleOutsideClick(id: string, event: MouseEvent): void;
  dialogProps(id: string): Record<string, string | boolean | undefined>;
  destroy(): void;
}

/** Internal configuration for the controller factory. */
export type DialogStoreConfig = {
  scroll?: ScrollStore;
  defaultCloseOnEscape?: boolean;
  defaultCloseOnOutsideClick?: boolean;
  defaultScrollLock?: boolean;
};

/** Options accepted by the dialog plugin factory. */
export interface CreateDialogOptions {
  readonly id?: string;
  readonly scroll?: ScrollStore;
  readonly closeOnEscape?: boolean;
  readonly closeOnOutsideClick?: boolean;
  readonly scrollLock?: boolean;
  /**
   * `$store.dialog` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_DIALOG_STORE_KEY}. Set when the host
   * already owns a `dialog` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the controller.
   */
  readonly storeKey?: string;
}

/** Default `$store.dialog` key registered by {@link dialogPlugin}. */
export const DEFAULT_DIALOG_STORE_KEY = "dialog";

/** Typed view of `Alpine` the dialog plugin uses internally. */
export type DialogAlpine = Alpine<{ dialog: DialogStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type DialogPluginCallback = PluginCallback<AlpineBase>;
