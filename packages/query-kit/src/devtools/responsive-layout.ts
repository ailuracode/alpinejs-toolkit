import { applyMobilePanelHeight, resolveMobilePanelHeight } from "./panel-resize.js";
import { applyStyle } from "./style-utils.js";
import { paintClasses } from "./ui-styles.js";

export const COMPACT_PANEL_WIDTH = 680;
export const MOBILE_VIEWPORT_WIDTH = 640;

export type PanelPosition = "bottom" | "right";

export type ResponsiveLayoutTargets = {
  panel: HTMLElement;
  resizeHandle: HTMLElement;
  headerToolbar: HTMLElement;
  toolbarTop: HTMLElement;
  toolbarBottom: HTMLElement;
  body: HTMLElement;
  list: HTMLElement;
  searchInput: HTMLInputElement;
  adapterSelect: HTMLSelectElement;
  sortSelect: HTMLSelectElement;
  tabs: HTMLElement;
  queriesTab: HTMLButtonElement;
  mutationsTab: HTMLButtonElement;
  position: PanelPosition;
};

let compactLayout = false;

export function isCompactLayout(): boolean {
  return compactLayout;
}

export function statGridColumnTemplate(compact: boolean): string {
  if (compact) {
    return "repeat(auto-fill, minmax(6.5rem, 1fr))";
  }

  return "repeat(auto-fill, minmax(9.5rem, 1fr))";
}

function applyCompactBottomPanelLayout(
  targets: ResponsiveLayoutTargets,
  mobilePanelHeight: number | null
): void {
  paintClasses(targets.body, "aq-devtools-body");
  applyStyle(targets.body, {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr",
  });
  applyStyle(targets.list, {
    borderRight: "none",
    borderBottom: "none",
  });
  applyStyle(targets.panel, {
    left: "0.5rem",
    right: "0.5rem",
    width: "auto",
    bottom: "0.5rem",
    transform: "none",
    borderRadius: "var(--aq-radius) var(--aq-radius) 0 0",
  });
  applyMobilePanelHeight(targets.panel, resolveMobilePanelHeight(mobilePanelHeight));
  targets.resizeHandle.hidden = false;
}

function applyToolbarResponsiveLayout(targets: ResponsiveLayoutTargets, compact: boolean): void {
  applyStyle(targets.headerToolbar, {
    flexDirection: "column",
    gap: "0.5rem",
  });

  applyStyle(targets.toolbarTop, {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    minWidth: "0",
  });

  applyStyle(targets.toolbarBottom, {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    minWidth: "0",
  });

  applyStyle(targets.searchInput, {
    flex: "1 1 12rem",
    minWidth: compact ? "100%" : "0",
    width: compact ? "100%" : undefined,
  });

  applyStyle(targets.adapterSelect, {
    flex: compact ? "1 1 calc(50% - 0.25rem)" : "0 1 auto",
    maxWidth: compact ? "none" : "11.5rem",
  });

  applyStyle(targets.sortSelect, {
    flex: compact ? "1 1 calc(50% - 0.25rem)" : "0 1 auto",
    maxWidth: compact ? "none" : "12rem",
  });

  applyStyle(targets.tabs, {
    display: "inline-flex",
    marginLeft: compact ? "0" : "auto",
    width: compact ? "100%" : undefined,
  });

  applyStyle(targets.queriesTab, {
    flex: compact ? "1 1 0" : undefined,
  });

  applyStyle(targets.mutationsTab, {
    flex: compact ? "1 1 0" : undefined,
  });
}

function applyRightPanelLayout(targets: ResponsiveLayoutTargets, compact: boolean): void {
  paintClasses(targets.body, "aq-devtools-body");
  applyStyle(targets.body, {
    gridTemplateColumns: "1fr",
    gridTemplateRows: compact ? "1fr" : "minmax(180px, 38%) 1fr",
  });
  applyStyle(targets.list, {
    borderRight: "none",
    borderBottom: compact ? "none" : "1px solid var(--aq-border)",
  });
}

export function applyResponsiveLayout(
  targets: ResponsiveLayoutTargets,
  compact: boolean,
  mobilePanelHeight: number | null = null
): void {
  compactLayout = compact;

  applyToolbarResponsiveLayout(targets, compact);

  if (targets.position === "right") {
    applyRightPanelLayout(targets, compact);
    return;
  }

  if (compact) {
    applyCompactBottomPanelLayout(targets, mobilePanelHeight);
    return;
  }

  targets.resizeHandle.hidden = true;

  paintClasses(targets.body, "aq-devtools-body");
  applyStyle(targets.list, {
    borderRight: "1px solid var(--aq-border)",
    borderBottom: "none",
  });
}

export function bindPanelResponsiveLayout(
  targets: ResponsiveLayoutTargets,
  onCompactChange?: () => void,
  getMobilePanelHeight?: () => number | null
): () => void {
  const media = window.matchMedia(`(max-width: ${MOBILE_VIEWPORT_WIDTH}px)`);

  const sync = (): void => {
    const width = targets.panel.getBoundingClientRect().width;
    const next = media.matches || (width > 0 && width < COMPACT_PANEL_WIDTH);
    const changed = next !== compactLayout;
    applyResponsiveLayout(targets, next, getMobilePanelHeight?.() ?? null);
    if (changed) {
      onCompactChange?.();
    }
  };

  const observer = new ResizeObserver(sync);
  observer.observe(targets.panel);
  media.addEventListener("change", sync);
  sync();

  return () => {
    observer.disconnect();
    media.removeEventListener("change", sync);
  };
}
