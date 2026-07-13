import { type SelectionMode, serializeSelection } from "@ailuracode/alpine-selection";
import type { AlpineInstance } from "../types/alpine.js";

const ITEM_CLASS =
  "w-full cursor-pointer rounded-md border px-3 py-2 text-left text-sm transition-colors";

type SelectionDemoData = {
  items: readonly string[];
  disabled: readonly string[];
  mode: SelectionMode;
  init(): void;
  itemClass(key: string): string;
  pick(event: MouseEvent, key: string): void;
  setMode(mode: SelectionMode): void;
  serialized(): string;
  copyUrl(): void;
};

type SelectionDemoComponent = SelectionDemoData & {
  $store: {
    selection: import("@ailuracode/alpine-selection").SelectionStore;
  };
};

export function registerSelectionDemo(Alpine: AlpineInstance): void {
  Alpine.data(
    "selectionDemo",
    (): SelectionDemoData => ({
      items: ["Alpha", "Bravo", "Charlie", "Delta", "Echo"],
      disabled: ["Charlie"],
      mode: "multiple",

      init(this: SelectionDemoComponent) {
        this.$store.selection.create("demo", {
          mode: this.mode,
          keys: this.items,
          disabledKeys: this.disabled,
        });
      },

      itemClass(this: SelectionDemoComponent, key: string) {
        const snap = this.$store.selection.instances.demo;
        if (!snap) {
          return ITEM_CLASS;
        }

        const selected = snap.selectedKeys.includes(key);
        const active = snap.activeKey === key;
        const selectable = !snap.disabledKeys.includes(key);

        return [
          ITEM_CLASS,
          selected ? "border-primary bg-primary/10" : "border-border",
          active ? "ring-2 ring-primary/40" : "",
          !selectable ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ");
      },

      pick(this: SelectionDemoComponent, event: MouseEvent, key: string) {
        const snap = this.$store.selection.instances.demo;
        if (!snap || snap.disabledKeys.includes(key)) {
          return;
        }

        this.$store.selection.setActive("demo", key);

        if (event.shiftKey) {
          this.$store.selection.extend("demo", key);
          return;
        }

        if (event.metaKey || event.ctrlKey) {
          this.$store.selection.toggle("demo", key);
          return;
        }

        this.$store.selection.replace("demo", key);
      },

      setMode(this: SelectionDemoComponent, mode: SelectionMode) {
        this.mode = mode;
        this.$store.selection.setMode("demo", mode);
      },

      serialized(this: SelectionDemoComponent) {
        const snap = this.$store.selection.instances.demo;
        if (!snap) {
          return "";
        }
        return serializeSelection(snap.value, snap.mode);
      },

      copyUrl(this: SelectionDemoComponent) {
        const encoded = encodeURIComponent(this.serialized());
        const url = `${window.location.pathname}?selected=${encoded}&mode=${this.mode}`;
        navigator.clipboard.writeText(url);
      },
    })
  );
}
