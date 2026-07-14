import Alpine from "alpinejs";
import { describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { historyPlugin } from "../src/plugin.js";

describe("@ailuracode/alpine-history", () => {
  describe("historyPlugin", () => {
    it("registers $store.history", () => {
      startAlpine(historyPlugin({ initialValue: "test" }));

      const store = Alpine.store("history") as { value: string };
      expect(store).toBeDefined();
      expect(store.value).toBe("test");
    });

    it("registers $history magic", () => {
      startAlpine(historyPlugin({ initialValue: "magic" }));

      document.body.innerHTML = '<div x-data x-text="$history.current"></div>';
      const el = document.querySelector<HTMLElement>("[x-data]");
      if (el) {
        Alpine.initTree(el);
      }

      expect(Alpine.store("history")).toBeDefined();
    });

    it("commits values through the store", () => {
      startAlpine(historyPlugin({ initialValue: "initial" }));

      const store = Alpine.store("history") as {
        value: string;
        commit(value: string): void;
        undo(): string | undefined;
      };

      store.commit("second");
      expect(store.value).toBe("second");

      store.undo();
      expect(store.value).toBe("initial");
    });

    it("propagates limit option", () => {
      startAlpine(historyPlugin({ limit: 3, initialValue: "start" }));

      const store = Alpine.store("history") as {
        commit(value: string): void;
        undoStack: readonly unknown[];
      };

      for (let i = 0; i < 5; i++) {
        store.commit(`v-${i}`);
      }

      expect(store.undoStack.length).toBe(3);
    });

    it("supports undo/redo via store methods", () => {
      startAlpine(historyPlugin({ initialValue: "initial" }));

      const store = Alpine.store("history") as {
        value: string;
        commit(value: string): void;
        undo(): string | undefined;
        redo(): string | undefined;
        canUndo: boolean;
        canRedo: boolean;
      };

      store.commit("first");
      store.commit("second");

      expect(store.canUndo).toBe(true);

      store.undo();
      expect(store.value).toBe("first");
      expect(store.canRedo).toBe(true);

      store.redo();
      expect(store.value).toBe("second");
    });

    it("uses custom storeKey", () => {
      startAlpine(historyPlugin({ storeKey: "myHistory", initialValue: "custom" }));

      const store = Alpine.store("myHistory") as { value: string };
      expect(store).toBeDefined();
      expect(store.value).toBe("custom");
    });
  });
});
