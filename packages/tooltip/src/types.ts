/**
 * Public type contracts for `@ailuracode/alpine-tooltip`.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import type { Alpine, PluginCallback } from "./core-deps.js";

/** Options passed when registering a tooltip instance. */
export type TooltipInstanceOptions = {
  readonly openDelay?: number;
  readonly closeDelay?: number;
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
};

/** Internal representation of a tooltip instance. */
export type TooltipInstance = {
  open: boolean;
  openDelay: number;
  closeDelay: number;
  openTimer: ReturnType<typeof setTimeout> | null;
  closeTimer: ReturnType<typeof setTimeout> | null;
  onOpen?: () => void;
  onClose?: () => void;
};

/** Discriminator for change events. */
export type TooltipChangeSource = "user" | "initialization";

/** Detail payload for the `change` event. */
export interface TooltipChangeDetail {
  readonly instanceId: string;
  readonly open: boolean;
  readonly source: TooltipChangeSource;
}

/** Alpine-facing store surface. */
export interface TooltipStore {
  readonly instances: Record<string, TooltipInstance>;
  register(id: string, options?: TooltipInstanceOptions): void;
  unregister(id: string): void;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  showOnHover(id: string): void;
  hideOnHover(id: string): void;
  showOnFocus(id: string): void;
  hideOnFocus(id: string): void;
  handleKeydown(id: string, event: KeyboardEvent): void;
  destroy(): void;
}

/** Options accepted by the tooltip plugin factory. */
export interface CreateTooltipOptions {
  readonly id?: string;
  /**
   * `$store.tooltip` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_TOOLTIP_STORE_KEY}. Set when the host
   * already owns a `tooltip` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the controller.
   */
  readonly storeKey?: string;
}

/** Default `$store.tooltip` key registered by {@link tooltipPlugin}. */
export const DEFAULT_TOOLTIP_STORE_KEY = "tooltip";

/** Typed view of `Alpine` the tooltip plugin uses internally. */
export type TooltipAlpine = Alpine<{ tooltip: TooltipStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type TooltipPluginCallback = PluginCallback<AlpineBase>;
