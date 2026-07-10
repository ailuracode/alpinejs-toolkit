/// <reference types="@types/alpinejs" />

export type DialogOpenOptions = {
  trigger?: HTMLElement | null;
  labelledBy?: string;
  describedBy?: string;
};

export type DialogInstanceOptions = {
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  scrollLock?: boolean;
  labelledBy?: string;
  describedBy?: string;
  onOpen?: () => void;
  onClose?: () => void;
};

export interface DialogStore {
  instances: Record<string, import("./controller.js").DialogInstance>;
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

export interface DialogPluginOptions {
  onLockChange?: (locked: boolean) => void;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  scrollLock?: boolean;
}

export function dialogOptions<const T extends DialogPluginOptions>(options: T): T;
export function createDialogStore(options?: DialogPluginOptions): DialogStore;
export function createFocusTrap(container: HTMLElement): {
  activate(): void;
  deactivate(): void;
};
export function getFocusableElements(container: HTMLElement): HTMLElement[];
export function restoreFocus(element: HTMLElement | null): void;

export default function dialogPlugin(
  options?: DialogPluginOptions
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
