/**
 * Alpine.data factory for the command palette demo.
 *
 * Lives in a `.ts` file (not inline `x-data="..."` in the
 * `.astro` template) because multi-line JS expressions inside
 * `x-data` confuse the TypeScript/JSX parser in `.astro` —
 * the `>` that closes the `<div>` is mistaken for a tag end.
 * The fix here matches `registerToggleDemos`, `registerQueryDemos`,
 * etc.: register the component via `Alpine.data()` and reference
 * it by name (`commandDemo`) from the template.
 */
import type { AlpineInstance } from "../types/alpine.js";

type CommandStore = {
  register(action: {
    id: string;
    label: string;
    group: string;
    shortcut?: string;
    keywords?: string[];
    disabled?: boolean;
    action: () => void;
  }): void;
  toggle(): void;
  isOpen: boolean;
  handleKeydown(event: KeyboardEvent): void;
};

type ToastStore = {
  push(payload: { title?: string; variant?: string }): string;
};

type CommandDemoComponent = {
  handleGlobalKey(event: KeyboardEvent): void;
  init(): void;
};

export function registerCommandDemo(Alpine: AlpineInstance): void {
  Alpine.data(
    "commandDemo",
    (): CommandDemoComponent => ({
      init() {
        const command = Alpine.store("command") as unknown as CommandStore;
        command.register({
          id: "toggle-theme",
          label: "Toggle theme",
          group: "Appearance",
          shortcut: "⌘K",
          action: () => (Alpine.store("theme") as { toggle(): void }).toggle(),
        });
        command.register({
          id: "toast-demo",
          label: "Show toast",
          group: "Actions",
          keywords: ["notify"],
          action: () =>
            (Alpine.store("toast") as unknown as ToastStore).push({
              title: "Command executed",
              variant: "success",
            }),
        });
        command.register({
          id: "disabled-demo",
          label: "Disabled action",
          group: "Actions",
          disabled: true,
          // No-op action — disabled in the registry so it never runs.
          action: () => undefined,
        });
      },
      handleGlobalKey(event) {
        const command = Alpine.store("command") as unknown as CommandStore;
        const isMod = event.metaKey || event.ctrlKey;
        if (isMod && event.key.toLowerCase() === "k") {
          event.preventDefault();
          command.toggle();
          return;
        }
        if (command.isOpen) {
          command.handleKeydown(event);
        }
      },
    })
  );
}
