import { describe, expect, it, vi } from "vitest";
import { HistoryController } from "../src/controller.js";

describe("@ailuracode/alpine-history", () => {
  describe("HistoryController", () => {
    // ── Basic commits ────────────────────────────────────────────────

    it("starts with undefined value when no initialValue", () => {
      const controller = new HistoryController<string>();
      expect(controller.value).toBeUndefined();
      expect(controller.canUndo).toBe(false);
      expect(controller.canRedo).toBe(false);
    });

    it("starts with initialValue when provided", () => {
      const controller = new HistoryController({ initialValue: "hello" });
      expect(controller.value).toBe("hello");
      expect(controller.canUndo).toBe(false);
      expect(controller.canRedo).toBe(false);
    });

    it("tracks committed values", () => {
      const controller = new HistoryController<string>();
      controller.commit("first");
      expect(controller.value).toBe("first");
      expect(controller.canUndo).toBe(true);
    });

    it("deduplicates consecutive identical commits", () => {
      const controller = new HistoryController<string>();
      controller.commit("same");
      controller.commit("same");
      controller.commit("same");
      expect(controller.undoStack.length).toBe(1);
    });

    // ── Undo / redo ──────────────────────────────────────────────────

    it("undoes commits and restores previous values", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.commit("first");
      controller.commit("second");
      controller.commit("third");

      expect(controller.undo()).toBe("second");
      expect(controller.undo()).toBe("first");
      expect(controller.undo()).toBe("initial");
      expect(controller.undo()).toBeUndefined();
    });

    it("redoes undone commits", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.commit("first");
      controller.commit("second");

      controller.undo();
      controller.undo();
      expect(controller.redo()).toBe("first");
      expect(controller.redo()).toBe("second");
      expect(controller.redo()).toBeUndefined();
    });

    it("clears redo stack on new commit", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.commit("first");
      controller.commit("second");

      controller.undo();
      expect(controller.canRedo).toBe(true);

      controller.commit("new-branch");
      expect(controller.canRedo).toBe(false);
      expect(controller.redoStack.length).toBe(0);
    });

    // ── Clear ────────────────────────────────────────────────────────

    it("clears both stacks without changing value", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.commit("first");
      controller.commit("second");

      controller.clear();
      expect(controller.value).toBe("second");
      expect(controller.canUndo).toBe(false);
      expect(controller.canRedo).toBe(false);
    });

    // ── Reset ────────────────────────────────────────────────────────

    it("resets to new value and clears stacks", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.commit("first");
      controller.commit("second");

      controller.reset("reset-value");
      expect(controller.value).toBe("reset-value");
      expect(controller.canUndo).toBe(false);
      expect(controller.canRedo).toBe(false);
    });

    // ── Checkpoints ──────────────────────────────────────────────────

    it("creates checkpoint from current value", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.commit("first");

      controller.checkpoint();
      expect(controller.value).toBe("first");
      expect(controller.canUndo).toBe(true);
      expect(controller.undoStack.length).toBe(2);
    });

    it("undoes checkpoint restores to checkpoint value", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.commit("first");
      controller.checkpoint();

      // Undo should restore to the checkpoint entry
      const value = controller.undo();
      expect(value).toBe("first");
    });

    // ── History limits ───────────────────────────────────────────────

    it("enforces count-based limit", () => {
      const controller = new HistoryController<string>({ limit: 5 });
      for (let i = 0; i < 10; i++) {
        controller.commit(`value-${i}`);
      }
      expect(controller.undoStack.length).toBe(5);
      expect(controller.value).toBe("value-9");
    });

    it("evicts oldest entries when limit reached", () => {
      const controller = new HistoryController<string>({ limit: 3 });
      controller.commit("first");
      controller.commit("second");
      controller.commit("third");
      controller.commit("fourth");

      // "first" should be evicted
      expect(controller.undoStack.length).toBe(3);
      expect(controller.undoStack[0]?.value).toBe("second");
    });

    // ── Memory limits ────────────────────────────────────────────────

    it("enforces memory-based limit (maxSize)", () => {
      const controller = new HistoryController<string>({
        maxSize: 50,
        clone: (v) => v,
      });
      // Each entry: "value-XX" ~ 18 bytes * 2 = 36 estimatedSize
      controller.commit("a".repeat(10)); // ~20 bytes
      controller.commit("b".repeat(10)); // ~20 bytes
      controller.commit("c".repeat(10)); // ~20 bytes — should trigger eviction

      expect(controller.undoStack.length).toBeLessThanOrEqual(3);
    });

    // ── Clone strategy ───────────────────────────────────────────────

    it("deep clones values on commit", () => {
      const controller = new HistoryController<{ x: number }>();
      const obj = { x: 1 };
      controller.commit(obj);
      obj.x = 2;
      expect(controller.value?.x).toBe(1);
    });

    it("uses custom clone strategy", () => {
      const customClone = vi.fn((v: string) => `cloned-${v}`);
      const controller = new HistoryController<string>({ clone: customClone });
      controller.commit("hello");
      expect(customClone).toHaveBeenCalled();
    });

    // ── Equality strategy ────────────────────────────────────────────

    it("deduplicates using custom equality", () => {
      const controller = new HistoryController<{ x: number }>({
        equality: (a, b) => a.x === b.x,
      });
      controller.commit({ x: 1 });
      controller.commit({ x: 1 }); // Same x, should dedup
      controller.commit({ x: 2 }); // Different x

      expect(controller.undoStack.length).toBe(2);
    });

    // ── Transactions ─────────────────────────────────────────────────

    it("supports transactions with commit", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      const tx = controller.transaction("tx-start");

      controller.commit("tx-mid");
      expect(controller.value).toBe("tx-mid");

      tx.commit();
      expect(controller.transactionDepth).toBe(0);
      expect(controller.undoStack.length).toBe(1);
      expect(controller.value).toBe("tx-mid");
    });

    it("supports transaction rollback", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      const tx = controller.transaction("tx-value");

      controller.commit("should-not-persist");
      tx.rollback();

      expect(controller.transactionDepth).toBe(0);
      expect(controller.value).toBe("initial");
      expect(controller.undoStack.length).toBe(0);
    });

    it("restores undo stack after transaction commit", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.commit("before-tx");

      const tx = controller.transaction("tx-start");
      controller.commit("during-tx");
      tx.commit();

      // After transaction, undo should restore to "before-tx"
      expect(controller.undo()).toBe("before-tx");
      expect(controller.undo()).toBe("initial");
    });

    it("restores undo stack after transaction rollback", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.commit("before-tx");

      const tx = controller.transaction("tx-start");
      controller.commit("during-tx");
      tx.rollback();

      // Stack should be restored to pre-transaction state
      expect(controller.undoStack.length).toBe(1);
      expect(controller.undo()).toBe("initial");
    });

    // ── Metadata ─────────────────────────────────────────────────────

    it("attaches metadata to entries", () => {
      const controller = new HistoryController<string>();
      controller.commit("first", {
        label: "first-commit",
        group: "group-a",
        meta: { note: "test" },
      });

      const entry = controller.undoStack[0] as {
        meta: { label?: string; group?: string; meta?: unknown; id: string; timestamp: number };
      };
      expect(entry.meta.label).toBe("first-commit");
      expect(entry.meta.group).toBe("group-a");
      expect(entry.meta.meta).toEqual({ note: "test" });
      expect(entry.meta.id).toBeDefined();
      expect(entry.meta.timestamp).toBeGreaterThan(0);
    });

    // ── Persistence ──────────────────────────────────────────────────

    it("saves to persistence adapter on commit", () => {
      const save = vi.fn();
      const controller = new HistoryController<string>({
        persistence: { load: () => [], save, clear: vi.fn() },
      });
      controller.mount();

      controller.commit("first");
      expect(save).toHaveBeenCalled();
    });

    it("loads from persistence on mount", () => {
      const entries = [{ value: "persisted", meta: { id: "1", timestamp: Date.now() } }];
      const controller = new HistoryController<string>({
        persistence: { load: () => entries, save: vi.fn(), clear: vi.fn() },
      });
      controller.mount();

      expect(controller.value).toBe("persisted");
    });

    it("persists empty stacks on clear()", () => {
      const save = vi.fn();
      const controller = new HistoryController<string>({
        persistence: { load: () => [], save, clear: vi.fn() },
      });
      controller.mount();

      controller.commit("first");
      controller.clear();
      // The last save call should have an empty array
      const lastCall = save.mock.calls[save.mock.calls.length - 1];
      expect(lastCall[0]).toEqual([]);
    });

    // ── Debounced commits ────────────────────────────────────────────

    it("debounces commits when debounceMs is set", async () => {
      const controller = new HistoryController<string>({ debounceMs: 50 });
      controller.commit("first");
      controller.commit("second");
      controller.commit("third");

      // Before debounce fires, nothing should be committed yet
      expect(controller.undoStack.length).toBe(0);

      // Wait for debounce
      await vi.waitFor(() => {
        expect(controller.undoStack.length).toBe(1);
      });
      expect(controller.value).toBe("third");
    });

    // ── Multiple instances ───────────────────────────────────────────

    it("supports multiple independent instances", () => {
      const a = new HistoryController<string>();
      const b = new HistoryController<string>();

      a.commit("a-value");
      b.commit("b-value");

      expect(a.value).toBe("a-value");
      expect(b.value).toBe("b-value");

      a.undo();
      // Without initialValue, undoing the only entry preserves its value
      expect(a.value).toBe("a-value");
      expect(b.value).toBe("b-value");
    });

    // ── SSR safety ───────────────────────────────────────────────────

    it("works without browser globals (SSR)", () => {
      const controller = new HistoryController({ initialValue: "ssr" });
      controller.mount();
      expect(controller.value).toBe("ssr");
      controller.commit("next");
      expect(controller.value).toBe("next");
    });

    // ── destroy() ────────────────────────────────────────────────────

    it("becomes no-op after destroy", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      controller.mount();
      controller.destroy();

      controller.commit("after-destroy");
      expect(controller.value).toBe("initial");
      expect(controller.undo()).toBeUndefined();
      expect(controller.redo()).toBeUndefined();
    });

    it("is idempotent on destroy", () => {
      const controller = new HistoryController<string>();
      controller.mount();
      controller.destroy();
      controller.destroy(); // Should not throw
    });

    // ── Events ───────────────────────────────────────────────────────

    it("emits change events with correct source", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      const sources: string[] = [];

      controller.on("change", (detail) => {
        sources.push(detail.source);
      });

      controller.mount();
      controller.commit("first");
      controller.undo();
      controller.redo();
      controller.clear();

      // Wait for initialization microtask
      return Promise.resolve().then(() => {
        expect(sources).toContain("initialization");
        expect(sources).toContain("commit");
        expect(sources).toContain("undo");
        expect(sources).toContain("redo");
        expect(sources).toContain("clear");
      });
    });

    it("emits change detail with correct shape", () => {
      const controller = new HistoryController<string>({ initialValue: "initial" });
      let detail: unknown;

      controller.on("change", (d) => {
        detail = d;
      });

      controller.commit("first");

      expect(detail).toMatchObject({
        source: "commit",
        value: "first",
        canUndo: true,
        canRedo: false,
        transactionDepth: 0,
      });
    });

    // ── Undo without initial value ───────────────────────────────────

    it("returns undone value when no initial value", () => {
      const controller = new HistoryController<string>();
      controller.commit("first");

      const undone = controller.undo();
      expect(undone).toBe("first");
    });

    // ── Undo/redo stack copies ───────────────────────────────────────

    it("returns copies of stacks, not references", () => {
      const controller = new HistoryController<string>();
      controller.commit("first");

      const stack1 = controller.undoStack;
      const stack2 = controller.undoStack;
      expect(stack1).not.toBe(stack2);
      expect(stack1).toEqual(stack2);
    });
  });
});
