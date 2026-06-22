/// <reference types="@types/alpinejs" />

export type FullscreenChangeCallback = (fullscreen: boolean, element: Element | null) => void;

export type FullscreenErrorCallback = (event: Event) => void;

export interface FullscreenMagic {
  isSupported(): boolean;
  isFullscreen(): boolean;
  element(): Element | null;
  enter(element?: HTMLElement): Promise<boolean>;
  exit(): Promise<boolean>;
  toggle(element?: HTMLElement): Promise<boolean>;
  onChange(callback: FullscreenChangeCallback): () => void;
  onError(callback: FullscreenErrorCallback): () => void;
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $fullscreen: FullscreenMagic;
    }
  }
}
