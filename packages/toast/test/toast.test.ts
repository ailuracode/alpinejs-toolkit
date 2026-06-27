import type AlpineType from "alpinejs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import toastPlugin, {
  createToastMagic,
  createToastStore,
  PROMISE_LOADING_DURATION,
  resolveToastLimits,
  resolveToastPluginConfig,
  TOAST_STORE_KEY,
  type ToastMagic,
  type ToastStore,
  toastPositions,
  toastVariants,
} from "../src/index.js";

const demoVariants = ["success", "info", "warning", "error", "loading"] as const;
const demoPositions = ["top-center", "bottom-right"] as const;

interface ToastHarness<
  TVariants extends readonly string[] = typeof demoVariants,
  TPositions extends readonly string[] = typeof demoPositions,
> {
  toast: ToastMagic<TVariants, TPositions>;
  store: ToastStore<TVariants, TPositions>;
}

function createToastHarness<
  const TVariants extends readonly string[] = typeof demoVariants,
  const TPositions extends readonly string[] = typeof demoPositions,
>(
  options?: Parameters<typeof toastPlugin<TVariants, TPositions>>[0]
): ToastHarness<TVariants, TPositions> {
  const magics: Record<string, unknown> = {};
  const stores: Record<string, unknown> = {};

  const Alpine = {
    reactive<T>(value: T): T {
      return value;
    },
    magic(name: string, factory: () => unknown) {
      magics[name] = factory();
    },
    store(name: string, value?: unknown) {
      if (value !== undefined) {
        stores[name] = value;
      }

      return stores[name];
    },
  };

  const register = toastPlugin({
    variants: toastVariants(demoVariants),
    positions: toastPositions(demoPositions),
    ...options,
  } as Parameters<typeof toastPlugin<TVariants, TPositions>>[0]);
  if (typeof register === "function") {
    register(Alpine as unknown as AlpineType.Alpine);
  }

  return {
    toast: magics.toast as ToastMagic<TVariants, TPositions>,
    store: stores[TOAST_STORE_KEY] as ToastStore<TVariants, TPositions>,
  };
}

describe("@ailuracode/alpinejs-toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers $toast magic and internal store", () => {
    const { toast, store } = createToastHarness();

    expect(toast).toBeTypeOf("function");
    expect(store.items).toEqual([]);
    expect(store.defaultPosition).toBe("bottom-right");
    expect(store.maxToasts).toBe(5);
    expect(store.maxVisible).toBe(5);
  });

  it("pushes a toast with string title shorthand", () => {
    const { toast, store } = createToastHarness({ variants: [] });
    const id = toast("Hello");

    expect(id).toBeTruthy();
    expect(store.items[0]).toMatchObject({
      id,
      content: null,
      title: "Hello",
      variant: "default",
      position: "bottom-right",
      duration: 4000,
      removed: false,
    });
  });

  it("stores arbitrary typed content", () => {
    const { toast, store } = createToastHarness({ variants: [] });

    toast({
      content: { kind: "badge", label: "Pro plan", seats: 3 },
      variant: "default",
      duration: false,
    });

    expect(store.items[0]?.duration).toBe(false);
    expect(store.items[0]?.content).toEqual({
      kind: "badge",
      label: "Pro plan",
      seats: 3,
    });
    expect(store.items[0]?.title).toBeNull();
  });

  it("accepts content on variant shortcuts", () => {
    const { toast, store } = createToastHarness();

    toast.success({
      content: { kind: "badge", label: "Saved", seats: 1 },
    });

    expect(store.items[0]?.content).toMatchObject({ label: "Saved" });
    expect(store.items[0]?.variant).toBe("success");
  });

  it("updates promise toasts with successContent", async () => {
    const { toast, store } = createToastHarness({
      variants: ["loading", "success"] as const,
      promise: {
        loadingVariant: "loading",
        successVariant: "success",
      },
    });

    await toast.promise(() => Promise.resolve({ id: 42 }), {
      loading: "Saving...",
      successContent: (data: { id: number }) => ({ kind: "record", id: data.id }),
    });

    expect(store.items[0]?.content).toEqual({ kind: "record", id: 42 });
    expect(store.items[0]?.variant).toBe("success");
  });

  it("updates a toast in place via magic.update", () => {
    const { toast, store } = createToastHarness({ defaultDuration: 0 });

    const id = toast("Pending");
    toast.update(id, { variant: "loading", title: "Working…", duration: 0 });

    expect(store.items).toHaveLength(1);
    expect(store.items[0]?.id).toBe(id);
    expect(store.items[0]?.variant).toBe("loading");
    expect(store.items[0]?.title).toBe("Working…");
    expect(store.items[0]?.removed).toBe(false);

    toast.update(id, { variant: "default", title: "Done" });

    expect(store.items[0]?.variant).toBe("default");
    expect(store.items[0]?.title).toBe("Done");
  });

  it("pushes a toast with payload object", () => {
    const { toast, store } = createToastHarness({
      variants: toastVariants(["published"] as const),
      positions: toastPositions(["top-center"] as const),
    });

    toast({
      title: "Saved",
      description: "Changes stored",
      variant: "published",
      position: "top-center",
      duration: 0,
    });

    expect(store.items[0]).toMatchObject({
      title: "Saved",
      description: "Changes stored",
      variant: "published",
      position: "top-center",
      duration: false,
    });
  });

  it("registers variant shortcuts from plugin options", () => {
    const { toast, store } = createToastHarness();

    toast.success("OK");
    toast.info("FYI");
    toast.warning("Careful");
    toast.error("Failed");

    expect(store.items.map((item) => item.variant)).toEqual([
      "error",
      "warning",
      "info",
      "success",
    ]);
  });

  it("auto-dismisses after duration", () => {
    const { toast, store } = createToastHarness({ variants: [], defaultDuration: 4000 });
    const id = toast("Temporary", { duration: 1000 });

    expect(store.items).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(store.items[0]?.removed).toBe(true);
    vi.advanceTimersByTime(400);
    expect(store.items).toHaveLength(0);
    expect(id).toBeTruthy();
  });

  it("does not auto-dismiss when duration is false", () => {
    const { toast, store } = createToastHarness({ variants: [], defaultDuration: 4000 });
    toast("Persistent", { duration: false });

    vi.advanceTimersByTime(10_000);

    expect(store.items).toHaveLength(1);
    expect(store.items[0]?.removed).toBe(false);
    expect(store.items[0]?.duration).toBe(false);
  });

  it("cancels auto-dismiss when update sets duration to false", () => {
    const { toast, store } = createToastHarness({ variants: [], defaultDuration: 2000 });
    const id = toast("Persistent", { duration: 1000 });

    toast.update(id, { duration: false });
    vi.advanceTimersByTime(5000);

    expect(store.items).toHaveLength(1);
    expect(store.items[0]?.removed).toBe(false);
    expect(store.items[0]?.duration).toBe(false);
  });

  it("keeps a perpetual toast when a sibling auto-dismisses", () => {
    const { toast, store } = createToastHarness({
      variants: ["success", "warning"] as const,
      defaultDuration: 4000,
    });
    const undoId = toast.warning("File deleted", { duration: false });
    const successId = toast.success("Saved", { duration: 1000 });

    vi.advanceTimersByTime(1000);

    expect(store.items.find((item) => item.id === successId)?.removed).toBe(true);
    expect(store.items.find((item) => item.id === undoId)?.removed).toBe(false);

    vi.advanceTimersByTime(400);

    expect(store.items).toHaveLength(1);
    expect(store.items[0]?.id).toBe(undoId);
    expect(store.items[0]?.removed).toBe(false);
    expect(store.items[0]?.duration).toBe(false);
  });

  it("splits timed and persistent stacks at a position", () => {
    const { toast, store } = createToastHarness({
      variants: ["success", "warning"] as const,
      defaultDuration: 4000,
    });
    toast.warning("Undo", { duration: false });
    toast.success("Saved", { duration: 4000 });

    expect(store.timedItemsAt("bottom-right")).toHaveLength(1);
    expect(store.persistentItemsAt("bottom-right")).toHaveLength(1);
    expect(store.timedItemsAt("bottom-right")[0]?.title).toBe("Saved");
    expect(store.persistentItemsAt("bottom-right")[0]?.title).toBe("Undo");
  });

  it("maxToasts applies independently to timed and persistent stacks", () => {
    const { toast, store } = createToastHarness({
      variants: [],
      maxToasts: 2,
      defaultDuration: 4000,
    });
    toast("Persistent 1", { duration: false });
    toast("Persistent 2", { duration: false });
    toast("Persistent 3", { duration: false });
    toast("Timed 1");
    toast("Timed 2");
    toast("Timed 3");

    const activeTimed = store.timedItemsAt("bottom-right").filter((item) => !item.removed);
    const activePersistent = store
      .persistentItemsAt("bottom-right")
      .filter((item) => !item.removed);

    expect(activeTimed).toHaveLength(2);
    expect(activePersistent).toHaveLength(2);
    expect(activeTimed.map((item) => item.title)).toEqual(["Timed 3", "Timed 2"]);
    expect(activePersistent.map((item) => item.title)).toEqual(["Persistent 3", "Persistent 2"]);
  });

  it("routes scheduled dismiss through getStore accessor", () => {
    let dismissCalled = false;
    let store!: ToastStore;

    store = createToastStore({
      defaultDuration: 500,
      getStore: () =>
        new Proxy(store, {
          get(target, property, receiver) {
            if (property === "dismiss") {
              return (id: string) => {
                dismissCalled = true;
                return target.dismiss(id);
              };
            }

            return Reflect.get(target, property, receiver);
          },
        }) as ToastStore,
    });

    store.push({ title: "Timed toast" });
    vi.advanceTimersByTime(500);

    expect(dismissCalled).toBe(true);
    expect(store.items[0]?.removed).toBe(true);
  });

  it("dismisses manually", () => {
    const { toast, store } = createToastHarness({ variants: [] });
    const id = toast("Dismiss me", { duration: 0 });

    toast.dismiss(id);
    expect(store.items[0]?.removed).toBe(true);
    vi.advanceTimersByTime(400);
    expect(store.items).toHaveLength(0);
  });

  it("dismisses via store.dismiss from templates", () => {
    const { toast, store } = createToastHarness({ variants: [] });
    const id = toast("Close me", { duration: 0 });

    store.dismiss(id);
    expect(store.items[0]?.removed).toBe(true);
    vi.advanceTimersByTime(400);
    expect(store.items).toHaveLength(0);
  });

  it("dismisses an entire position stack with dismissAt", () => {
    const { toast, store } = createToastHarness({ variants: [], defaultDuration: 0 });

    toast("br-1", { position: "bottom-right" });
    toast("br-2", { position: "bottom-right" });
    toast("tc-1", { position: "top-center" });

    store.dismissAt("bottom-right");

    expect(store.itemsAt("bottom-right").every((item) => item.removed)).toBe(true);
    expect(store.itemsAt("top-center")[0]?.removed).toBe(false);

    vi.advanceTimersByTime(400);
    expect(store.itemsAt("bottom-right")).toHaveLength(0);
    expect(store.itemsAt("top-center")).toHaveLength(1);
  });

  it("dismisses every stack with dismissAll", () => {
    const { toast, store } = createToastHarness({ variants: [], defaultDuration: 0 });

    toast("br", { position: "bottom-right" });
    toast("tc", { position: "top-center" });

    toast.dismissAll();

    expect(store.items.every((item) => item.removed)).toBe(true);
    vi.advanceTimersByTime(400);
    expect(store.items).toHaveLength(0);
  });

  it("passes fromPayload variants through unchanged", () => {
    const { toast, store } = createToastHarness({
      variants: ["queued", "failed"] as const,
    });

    toast.fromPayload({ title: "Done", variant: "queued" });
    toast.fromPayload({ title: "Oops", variant: "failed" });
    toast.fromPayload({ title: "Plain" });

    expect(store.items.map((item) => item.variant)).toEqual(["default", "failed", "queued"]);
  });

  it("resolves promise toasts", async () => {
    const { toast, store } = createToastHarness({
      variants: demoVariants,
      promise: {
        loadingVariant: "loading",
        successVariant: "success",
        errorVariant: "error",
      },
    });
    const promise = toast.promise(() => Promise.resolve("payload"), {
      loading: "Saving...",
      success: (data) => `Saved ${data}`,
      error: "Failed",
    });

    expect(store.items[0]).toMatchObject({
      title: "Saving...",
      variant: "loading",
      duration: PROMISE_LOADING_DURATION,
    });

    await promise;
    expect(store.items[0]).toMatchObject({
      title: "Saved payload",
      variant: "success",
      duration: 4000,
    });
  });

  it("keeps promise loading in the timed stack", () => {
    const { toast, store } = createToastHarness({
      variants: demoVariants,
      promise: { loadingVariant: "loading", successVariant: "success" },
    });

    let resolve!: (value: string) => void;
    toast.promise(
      () =>
        new Promise<string>((resolvePromise) => {
          resolve = resolvePromise;
        }),
      { loading: "Saving..." }
    );

    expect(store.timedItemsAt("bottom-right").some((item) => item.variant === "loading")).toBe(
      true
    );
    expect(store.persistentItemsAt("bottom-right")).toHaveLength(0);

    resolve("ok");
  });

  it("does not auto-dismiss promise loading before settlement", () => {
    const { toast, store } = createToastHarness({
      variants: demoVariants,
      promise: { loadingVariant: "loading", successVariant: "success" },
    });

    toast.promise(
      () =>
        new Promise<string>(() => {
          /* never settles */
        }),
      { loading: "Saving..." }
    );

    vi.advanceTimersByTime(PROMISE_LOADING_DURATION + 10_000);

    expect(store.items[0]?.variant).toBe("loading");
    expect(store.items[0]?.removed).toBe(false);
  });

  it("accepts an existing promise without a factory function", async () => {
    const { toast, store } = createToastHarness({
      variants: demoVariants,
      promise: { successVariant: "success", loadingVariant: "loading" },
    });

    await toast.promise(Promise.resolve("payload"), {
      loading: "Saving...",
      success: "Saved",
    });

    expect(store.items[0]).toMatchObject({
      title: "Saved",
      variant: "success",
      duration: 4000,
    });
  });

  it("keeps the loading title when success message is omitted", async () => {
    const { toast, store } = createToastHarness({
      variants: demoVariants,
      promise: { successVariant: "success", loadingVariant: "loading" },
    });

    await toast.promise(() => Promise.resolve("payload"), {
      loading: "Saving...",
    });

    expect(store.items[0]).toMatchObject({
      title: "Saving...",
      variant: "success",
      duration: 4000,
    });
  });

  it("updates promise toasts on failure", async () => {
    const { toast, store } = createToastHarness({
      variants: demoVariants,
      promise: { errorVariant: "error", loadingVariant: "loading" },
    });

    await expect(
      toast.promise(() => Promise.reject(new Error("nope")), {
        loading: "Saving...",
        error: "Could not save",
      })
    ).rejects.toThrow("nope");

    expect(store.items[0]).toMatchObject({
      title: "Could not save",
      variant: "error",
      duration: 4000,
    });
  });

  it("uses plugin promise.error when call-level error is omitted", async () => {
    const { toast, store } = createToastHarness({
      variants: demoVariants,
      promise: {
        error: "Something went wrong",
        errorVariant: "error",
        loadingVariant: "loading",
      },
    });

    await expect(
      toast.promise(() => Promise.reject(new Error("nope")), {
        loading: "Saving...",
      })
    ).rejects.toThrow("nope");

    expect(store.items[0]).toMatchObject({
      title: "Something went wrong",
      variant: "error",
    });
  });

  it("extends auto-dismiss when update replaces duration", () => {
    const { toast, store } = createToastHarness({ variants: [], defaultDuration: 5000 });
    const id = toast("Temporary", { duration: 5000 });

    vi.advanceTimersByTime(2000);
    toast.update(id, { duration: 10000 });

    vi.advanceTimersByTime(3000);
    expect(store.items[0]?.removed).toBe(false);

    vi.advanceTimersByTime(7000);
    expect(store.items[0]?.removed).toBe(true);
  });

  it("cancels auto-dismiss when update sets duration to 0", () => {
    const { toast, store } = createToastHarness({ variants: [] });
    const id = toast("Persistent", { duration: 2000 });

    toast.update(id, { duration: 0 });

    vi.advanceTimersByTime(5000);
    expect(store.items[0]?.removed).toBe(false);
    expect(store.items[0]?.duration).toBe(false);
  });

  it("normalizes duration 0 to false on push", () => {
    const { toast, store } = createToastHarness({ variants: [] });

    toast("Stay open", { duration: 0 });

    expect(store.items[0]?.duration).toBe(false);
  });

  it("normalizes defaultDuration 0 to false on push", () => {
    const { toast, store } = createToastHarness({ variants: [], defaultDuration: 0 });

    toast("Default perpetual");

    expect(store.items[0]?.duration).toBe(false);
  });

  it("pushUnique dismisses prior active toasts with the same key", () => {
    const { toast, store } = createToastHarness({ variants: [], defaultDuration: 4000 });
    const first = toast.pushUnique("undo", { title: "First", duration: false });
    const second = toast.pushUnique("undo", { title: "Second", duration: false });

    expect(store.items.find((item) => item.id === first)?.removed).toBe(true);
    expect(store.activePersistentItemsAt("bottom-right")).toHaveLength(1);
    expect(store.activePersistentItemsAt("bottom-right")[0]?.id).toBe(second);
  });

  it("activeTimedItemsAt excludes removed toasts", () => {
    const { toast, store } = createToastHarness({ variants: [], defaultDuration: 4000 });
    const id = toast("One");
    toast("Two");

    store.dismiss(id);

    expect(store.timedItemsAt("bottom-right")).toHaveLength(2);
    expect(store.activeTimedItemsAt("bottom-right")).toHaveLength(1);
    expect(store.activeTimedItemsAt("bottom-right")[0]?.title).toBe("Two");
  });

  it("does not register variant shortcuts that collide with core methods", () => {
    const { toast } = createToastHarness({
      variants: ["success", "dismiss", "promise"] as const,
    });

    expect(toast.success).toBeTypeOf("function");
    expect(toast.dismiss).toBeTypeOf("function");
    expect(toast.promise).toBeTypeOf("function");
    expect("dismiss" in toast && toast.dismiss).toBe(toast.dismiss);
  });

  it("marks trimmed toasts as removed instead of dropping them immediately", () => {
    const { toast, store } = createToastHarness({
      maxToasts: 3,
      defaultDuration: 4000,
      variants: [],
    });

    toast("one");
    toast("two");
    toast("three");
    toast("four");

    const one = store.items.find((item) => item.title === "one");
    expect(one?.removed).toBe(true);
    expect(store.items.filter((item) => !item.removed).map((item) => item.title)).toEqual([
      "four",
      "three",
      "two",
    ]);

    vi.advanceTimersByTime(400);
    expect(store.items.find((item) => item.title === "one")).toBeUndefined();
  });

  it("isVisibleAt ignores removed toasts when ranking visibility", () => {
    const { toast, store } = createToastHarness({
      maxToasts: 5,
      maxVisible: 2,
      defaultDuration: 4000,
      variants: [],
    });

    toast("one");
    const second = toast("two");
    toast("three");

    store.dismiss(second);
    expect(store.isVisibleAt("bottom-right", 2)).toBe(true);
  });

  it("uses default variant for promise states when no custom variants are configured", async () => {
    const { toast, store } = createToastHarness({ variants: [] });

    await toast.promise(() => Promise.resolve("ok"), {
      loading: "Saving...",
      success: "Saved",
    });

    expect(store.items[0]).toMatchObject({
      title: "Saved",
      variant: "default",
      duration: 4000,
    });
  });

  it("listens to toast window events by default", () => {
    const { store } = createToastHarness({ variants: ["info"] as const });

    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { title: "From event", variant: "info" },
      })
    );

    expect(store.items[0]).toMatchObject({
      title: "From event",
      variant: "info",
    });
  });

  it("can disable window event listening", () => {
    const { store } = createToastHarness({ listenToWindowEvents: false, variants: [] });

    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { title: "Ignored" },
      })
    );

    expect(store.items).toHaveLength(0);
  });

  it("createToastStore respects defaults", () => {
    const store = createToastStore<readonly ["top-left"]>({
      defaultPosition: "top-left",
      defaultDuration: 2500,
    });

    store.push({ title: "Ping" });

    expect(store.defaultPosition).toBe("top-left");
    expect(store.items[0]?.duration).toBe(2500);
    expect(store.items[0]?.position).toBe("top-left");
  });

  it("createToastMagic works without Alpine plugin", () => {
    const store = createToastStore();
    const config = resolveToastPluginConfig({ variants: toastVariants(["success"] as const) });
    const toast = createToastMagic(
      config,
      () => store as unknown as ToastStore<typeof config.variants, typeof config.positions>
    );
    const id = toast.success("Standalone");

    expect(id).toBeTruthy();
    expect(store.items[0]?.variant).toBe("success");
  });

  it("trims the oldest toasts when the queue exceeds maxToasts", () => {
    const { toast, store } = createToastHarness({
      maxToasts: 3,
      defaultDuration: 4000,
      variants: [],
    });

    toast("one");
    toast("two");
    toast("three");
    toast("four");

    expect(store.items.filter((item) => !item.removed).map((item) => item.title)).toEqual([
      "four",
      "three",
      "two",
    ]);

    vi.advanceTimersByTime(400);
    expect(store.items).toHaveLength(3);
    expect(store.items.map((item) => item.title)).toEqual(["four", "three", "two"]);
  });

  it("allows unlimited toasts when maxToasts is 0", () => {
    const { toast, store } = createToastHarness({ maxToasts: 0, defaultDuration: 0, variants: [] });

    for (let i = 1; i <= 6; i++) {
      toast(`toast-${i}`);
    }

    expect(store.items).toHaveLength(6);
  });

  it("defaults maxVisible to maxToasts", () => {
    const store = createToastStore({ maxToasts: 4 });

    expect(store.maxVisible).toBe(4);
  });

  it("clamps maxVisible to maxToasts", () => {
    const store = createToastStore({ maxToasts: 3, maxVisible: 10 });

    expect(store.maxVisible).toBe(3);
  });

  it("limits rendered toasts per position stack with isVisibleAt", () => {
    const { toast, store } = createToastHarness({
      maxToasts: 5,
      maxVisible: 2,
      defaultDuration: 4000,
      variants: [],
    });

    toast("one");
    toast("two");
    toast("three");

    const stack = store.itemsAt("bottom-right");

    expect(stack).toHaveLength(3);
    expect(store.isVisibleAt("bottom-right", 0)).toBe(true);
    expect(store.isVisibleAt("bottom-right", 1)).toBe(true);
    expect(store.isVisibleAt("bottom-right", 2)).toBe(false);
  });

  it("keeps independent stacks per position", () => {
    const { toast, store } = createToastHarness({
      maxToasts: 2,
      defaultDuration: 4000,
      variants: [],
    });

    toast("br-1", { position: "bottom-right" });
    toast("br-2", { position: "bottom-right" });
    toast("br-3", { position: "bottom-right" });
    toast("tc-1", { position: "top-center" });
    toast("tc-2", { position: "top-center" });

    expect(
      store
        .itemsAt("bottom-right")
        .filter((item) => !item.removed)
        .map((item) => item.title)
    ).toEqual(["br-3", "br-2"]);
    expect(
      store
        .itemsAt("top-center")
        .filter((item) => !item.removed)
        .map((item) => item.title)
    ).toEqual(["tc-2", "tc-1"]);
    expect(store.items.filter((item) => !item.removed)).toHaveLength(4);
  });

  it("exposes stackPositions from plugin options", () => {
    const { store } = createToastHarness();

    expect(store.stackPositions).toEqual(["bottom-right", "top-center"]);
  });

  it("resolveToastLimits keeps maxVisible independent when maxToasts is unlimited", () => {
    expect(resolveToastLimits({ maxToasts: 0, maxVisible: 3 })).toEqual({
      maxToasts: 0,
      maxVisible: 3,
    });
  });
});
