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
   */
  expanded: boolean;
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
