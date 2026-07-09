import type { AlpineInstance } from "../types/alpine.js";

export type DemoShellData = {
  copied: boolean;
  exportedText: boolean | null;
  exportedJson: boolean | null;
  exportedUrl: boolean | null;
  shared: boolean | null;
  /**
   * Local visual state for the desktop sidebar width. Decoupled from
   * `$store.sidebar` (which only owns visibility). Consumers choose how
   * to render the panel — rail, mini, expanded, etc.
   *
   * Only meaningful on desktop — see {@link DemoShellData.effectivelyExpanded}
   * for the layout-aware view that forces the expanded layout on
   * mobile / tablet regardless of the persisted preference.
   */
  expanded: boolean;
  /**
   * Layout-aware expansion: `true` on every breakpoint where the
   * sidebar is shown as an overlay (mobile / tablet), or the desktop
   * `expanded` flag. Components use this for content layout (icon
   * padding, labels visibility, etc.) — never use `expanded` directly,
   * else the persisted compact preference leaks into the mobile
   * overlay and the content renders icon-only inside a full-width
   * drawer.
   */
  readonly effectivelyExpanded: boolean;
};

export function registerDemoShell(Alpine: AlpineInstance): void {
  Alpine.data(
    "demoShell",
    (): DemoShellData => ({
      copied: false,
      exportedText: null,
      exportedJson: null,
      exportedUrl: null,
      shared: null,
      expanded: Alpine.$persist(true).as("playground-sidebar-expanded"),
      get effectivelyExpanded(): boolean {
        return this.expanded || Alpine.store("media").breakpoint !== "desktop";
      },
    })
  );
}

type ToastStoreLike = {
  update(
    id: string,
    payload: {
      variant?: string;
      title?: string | null;
      description?: string | null;
      action?: unknown;
      duration?: number | false;
    }
  ): void;
};

declare global {
  interface Window {
    undoToastDemo(id: string): void;
  }
}

export function registerToastDemoHandlers(Alpine: AlpineInstance): void {
  window.undoToastDemo = (id: string) => {
    const toast = Alpine.store("toast") as ToastStoreLike;

    toast.update(id, {
      variant: "loading",
      title: "Undoing…",
      description: null,
      action: null,
      duration: false,
    });

    setTimeout(() => {
      toast.update(id, {
        variant: "success",
        title: "Change undone",
        description: null,
        action: null,
        duration: 4000,
      });
    }, 1200);
  };
}
