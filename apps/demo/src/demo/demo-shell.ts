import type { Alpine } from "alpinejs";

export type DemoShellData = {
  copied: boolean;
  exportedText: boolean | null;
  exportedJson: boolean | null;
  exportedUrl: boolean | null;
  shared: boolean | null;
};

export function registerDemoShell(Alpine: Alpine): void {
  Alpine.data(
    "demoShell",
    (): DemoShellData => ({
      copied: false,
      exportedText: null,
      exportedJson: null,
      exportedUrl: null,
      shared: null,
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

export function registerToastDemoHandlers(Alpine: Alpine): void {
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
