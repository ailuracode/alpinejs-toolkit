/// <reference types="@types/alpinejs" />

import type { DialogInstance, DialogInstanceOptions, DialogOpenOptions } from "./types";

export type {
  DialogChangeSource,
  DialogCloseDetail,
  DialogInstance,
  DialogInstanceOptions,
  DialogOpenDetail,
  DialogOpenOptions,
} from "./types";

export interface DialogStore {
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

export function createDialogController(
  config?: import("./types").DialogStoreConfig
): import("./types").DialogController;

export default function dialogPlugin(
  options?: import("./types").CreateDialogOptions
): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      dialog: DialogStore;
    }
    interface Magics<T> {
      $dialog: DialogStore;
    }
  }
}
