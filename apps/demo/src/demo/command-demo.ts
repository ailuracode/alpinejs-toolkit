/**
 * Alpine.data factory for the command palette demo.
 */
import type { AlpineInstance } from "../types/alpine.js";

type CommandStore = {
  items: Record<string, { id: string }>;
  register(action: {
    id: string;
    label: string;
    group: string;
    shortcut?: string;
    keywords?: string[];
    aliases?: string[];
    disabled?: boolean;
    page?: string;
    action: () => void;
  }): () => void;
  pushPage(page: { id: string; title: string; load?: () => Promise<void> }): Promise<void>;
  toggle(): void;
  isOpen: boolean;
  currentPageId: string;
  handleKeydown(event: KeyboardEvent): void;
  inputProps(): Record<string, string | boolean | undefined>;
  listboxProps(): Record<string, string | boolean | undefined>;
  optionProps(id: string): Record<string, string | number | boolean | undefined>;
  itemState(id: string): { disabled: boolean; loading: boolean } | null;
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
        const registerDemo = (item: Parameters<CommandStore["register"]>[0]): void => {
          if (item.id in command.items) {
            return;
          }
          command.register(item);
        };

        registerDemo({
          id: "toggle-theme",
          label: "Toggle theme",
          group: "Appearance",
          shortcut: "⌘K",
          aliases: ["spotlight"],
          action: () => (Alpine.store("theme") as { toggle(): void }).toggle(),
        });
        registerDemo({
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
        registerDemo({
          id: "open-settings-page",
          label: "Open settings page",
          group: "Navigation",
          action: () => {
            void command.pushPage({
              id: "settings",
              title: "Settings",
              load: () => {
                command.register({
                  id: "settings-theme",
                  label: "Theme settings",
                  group: "Settings",
                  page: "settings",
                  action: () => (Alpine.store("theme") as { toggle(): void }).toggle(),
                });
              },
            });
          },
        });
        registerDemo({
          id: "disabled-demo",
          label: "Disabled action",
          group: "Actions",
          disabled: true,
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
