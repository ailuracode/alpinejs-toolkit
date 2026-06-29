import { applyStyle } from "./style-utils.js";

export const MOBILE_PANEL_MIN_HEIGHT = 400;

export function getDefaultMobilePanelHeight(): number {
  if (typeof window === "undefined") {
    return MOBILE_PANEL_MIN_HEIGHT;
  }

  return Math.min(window.innerHeight * 0.92, window.innerHeight - 16);
}

export function getMaxMobilePanelHeight(): number {
  return Math.max(MOBILE_PANEL_MIN_HEIGHT, getDefaultMobilePanelHeight());
}

export function getMinMobilePanelHeight(): number {
  return Math.min(MOBILE_PANEL_MIN_HEIGHT, getMaxMobilePanelHeight());
}

export function clampMobilePanelHeight(height: number): number {
  const max = getMaxMobilePanelHeight();
  const min = getMinMobilePanelHeight();

  return Math.min(max, Math.max(min, Math.round(height)));
}

export function resolveMobilePanelHeight(stored: number | null | undefined): number {
  if (typeof stored === "number" && Number.isFinite(stored) && stored > 0) {
    return clampMobilePanelHeight(stored);
  }

  return clampMobilePanelHeight(getDefaultMobilePanelHeight());
}

export function applyMobilePanelHeight(panel: HTMLElement, height: number): void {
  applyStyle(panel, {
    height: `${clampMobilePanelHeight(height)}px`,
    minHeight: `${getMinMobilePanelHeight()}px`,
  });
}

export type MobilePanelResizeOptions = {
  panel: HTMLElement;
  handle: HTMLElement;
  onResize: (height: number) => void;
};

export function bindMobilePanelResize(options: MobilePanelResizeOptions): () => void {
  let dragging = false;
  let startY = 0;
  let startHeight = 0;

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }

    event.preventDefault();
    const next = clampMobilePanelHeight(startHeight + (startY - event.clientY));
    applyMobilePanelHeight(options.panel, next);
    options.onResize(next);
  };

  const endDrag = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }

    dragging = false;

    if (options.handle.hasPointerCapture(event.pointerId)) {
      options.handle.releasePointerCapture(event.pointerId);
    }

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    dragging = true;
    startY = event.clientY;
    startHeight = options.panel.getBoundingClientRect().height;
    options.handle.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    event.preventDefault();
  };

  options.handle.addEventListener("pointerdown", onPointerDown);

  return () => {
    options.handle.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  };
}
