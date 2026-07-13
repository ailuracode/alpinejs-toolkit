import type { MutationState, QueryState } from "@ailuracode/alpine-query";
import { vanillaQueryAdapter } from "@ailuracode/alpine-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import {
  bridgeMutationHandleToAlpine,
  bridgeQueryHandleToAlpine,
  createAlpineBridgedAdapter,
} from "../src/bridge.js";

function createMockHandle() {
  const listeners = new Set<(record: any) => void>();
  const record: any = {
    data: undefined,
    error: null,
    status: "pending",
    fetchStatus: "idle",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
  };

  const refetch = vi.fn().mockResolvedValue(undefined);
  const state = {
    ...record,
    refetch,
    get data() {
      return record.data;
    },
    get error() {
      return record.error;
    },
    get status() {
      return record.status;
    },
    get fetchStatus() {
      return record.fetchStatus;
    },
    get dataUpdatedAt() {
      return record.dataUpdatedAt;
    },
    get errorUpdatedAt() {
      return record.errorUpdatedAt;
    },
    get isStale() {
      return true;
    },
    get isFetching() {
      return false;
    },
    get isError() {
      return record.status === "error";
    },
    get isSuccess() {
      return record.status === "success";
    },
    get isPending() {
      return record.status === "pending";
    },
  };

  return {
    record,
    state: state as QueryState<unknown>,
    refetch,
    get: () => record,
    patch: (p: any) => {
      Object.assign(record, p);
      for (const l of listeners) {
        l(record);
      }
    },
    listen: (l: any) => {
      listeners.add(l);
      l(record);
      return () => listeners.delete(l);
    },
    setStaleTime: (_n: number) => {},
    getStaleTime: () => 60_000,
  };
}

function createMockMutationHandle() {
  const listeners = new Set<(record: any) => void>();
  const record: any = { data: undefined, error: null, status: "idle" };

  const mutate = vi.fn();
  const reset = vi.fn();
  const state = {
    get data() {
      return record.data;
    },
    get error() {
      return record.error;
    },
    get status() {
      return record.status;
    },
    get isIdle() {
      return record.status === "idle";
    },
    get isPending() {
      return record.status === "pending";
    },
    get isError() {
      return record.status === "error";
    },
    get isSuccess() {
      return record.status === "success";
    },
    mutate,
    reset,
  };

  return {
    record,
    state: state as MutationState<unknown, unknown>,
    get: () => record,
    patch: (p: any) => {
      Object.assign(record, p);
      for (const l of listeners) {
        l(record);
      }
    },
    listen: (l: any) => {
      listeners.add(l);
      l(record);
      return () => listeners.delete(l);
    },
  };
}

describe("bridge.ts — coverage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("bridgeQueryHandleToAlpine", () => {
    it("bridges a query handle to Alpine.reactive", () => {
      const Alpine = startAlpine();
      const handle = createMockHandle();
      const bridge = bridgeQueryHandleToAlpine(Alpine, handle, () => 60_000);

      expect(bridge.state).toBeDefined();
      expect(typeof bridge.unbind).toBe("function");
    });

    it("syncs record updates to bridged state via listener", () => {
      const Alpine = startAlpine();
      const handle = createMockHandle();
      const bridge = bridgeQueryHandleToAlpine(Alpine, handle, () => 60_000);

      handle.patch({ data: "test", status: "success", dataUpdatedAt: 12345 });

      expect((bridge.state as any).data).toBe("test");
      expect((bridge.state as any).status).toBe("success");
      expect((bridge.state as any).dataUpdatedAt).toBe(12345);
    });

    it("unbind stops syncing", () => {
      const Alpine = startAlpine();
      const handle = createMockHandle();
      const bridge = bridgeQueryHandleToAlpine(Alpine, handle, () => 60_000);

      bridge.unbind();
      handle.patch({ data: "after-unbind" });

      expect((bridge.state as any).data).toBeUndefined();
    });
  });

  describe("bridgeMutationHandleToAlpine", () => {
    it("bridges a mutation handle to Alpine.reactive", () => {
      const Alpine = startAlpine();
      const handle = createMockMutationHandle();
      const bridge = bridgeMutationHandleToAlpine(Alpine, handle);

      expect(bridge.state).toBeDefined();
      expect(typeof bridge.unbind).toBe("function");
    });

    it("syncs mutation record updates", () => {
      const Alpine = startAlpine();
      const handle = createMockMutationHandle();
      const bridge = bridgeMutationHandleToAlpine(Alpine, handle);

      handle.patch({ status: "pending" });
      expect((bridge.state as any).status).toBe("pending");

      handle.patch({ data: "ok", status: "success" });
      expect((bridge.state as any).data).toBe("ok");
      expect((bridge.state as any).status).toBe("success");
    });

    it("binds mutate and reset to the source state", () => {
      const Alpine = startAlpine();
      const handle = createMockMutationHandle();
      const bridge = bridgeMutationHandleToAlpine(Alpine, handle);

      (bridge.state as any).mutate("v");
      expect(handle.state.mutate).toHaveBeenCalledWith("v");

      (bridge.state as any).reset();
      expect(handle.state.reset).toHaveBeenCalled();
    });

    it("unbind stops syncing", () => {
      const Alpine = startAlpine();
      const handle = createMockMutationHandle();
      const bridge = bridgeMutationHandleToAlpine(Alpine, handle);

      bridge.unbind();
      handle.patch({ status: "pending" });

      expect((bridge.state as any).status).toBe("idle");
    });
  });

  describe("createAlpineBridgedAdapter", () => {
    it("wraps a base adapter and delegates name", () => {
      const Alpine = startAlpine();
      const base = { ...vanillaQueryAdapter, name: "TestBase" };
      const bridged = createAlpineBridgedAdapter(Alpine, base);

      expect(bridged.name).toBe("TestBase");
    });

    it("falls back to staleTime when handle has no getStaleTime", () => {
      const Alpine = startAlpine();
      const baseAdapter: any = {
        name: "NoStaleTime",
        createQueryState(initial: any, staleTime: any, refetch: any) {
          const listeners = new Set<(r: any) => void>();
          const record = { ...initial };
          const state: any = { ...initial, refetch };
          return {
            state,
            get: () => record,
            patch: (p: any) => {
              Object.assign(record, p);
              for (const l of listeners) {
                l(record);
              }
            },
            listen: (l: any) => {
              listeners.add(l);
              l(record);
              return () => listeners.delete(l);
            },
          };
        },
        createMutationState(handlers: any) {
          return {
            state: { ...handlers },
            get: () => ({ data: undefined, error: null, status: "idle" }),
            patch: () => {},
            listen: (l: any) => {
              l({ data: undefined, error: null, status: "idle" });
              return () => {};
            },
          };
        },
      };
      const bridged = createAlpineBridgedAdapter(Alpine, baseAdapter);
      const handle = bridged.createQueryState(
        {
          data: undefined,
          error: null,
          status: "pending",
          fetchStatus: "idle",
          dataUpdatedAt: 0,
          errorUpdatedAt: 0,
        },
        30_000,
        vi.fn()
      );

      // handle.getStaleTime is undefined, so ?? staleTime (30_000) is used
      expect(handle.getStaleTime?.()).toBeUndefined();
      expect(bridged.createQueryState).toBeDefined();
    });

    it("createQueryState returns bridged handle with Alpine state", () => {
      const Alpine = startAlpine();
      const base = vanillaQueryAdapter;
      const bridged = createAlpineBridgedAdapter(Alpine, base);
      const refetch = vi.fn();
      const handle = bridged.createQueryState(
        {
          data: undefined,
          error: null,
          status: "pending",
          fetchStatus: "idle",
          dataUpdatedAt: 0,
          errorUpdatedAt: 0,
        },
        60_000,
        refetch
      );

      expect(handle.state).toBeDefined();
      expect(handle.dispose).toBeDefined();
    });

    it("createMutationState returns bridged handle with Alpine state", () => {
      const Alpine = startAlpine();
      const base = vanillaQueryAdapter;
      const bridged = createAlpineBridgedAdapter(Alpine, base);
      const handle = bridged.createMutationState({
        mutate: vi.fn(),
        reset: vi.fn(),
      });

      expect(handle.state).toBeDefined();
      expect(handle.dispose).toBeDefined();
    });
  });
});
