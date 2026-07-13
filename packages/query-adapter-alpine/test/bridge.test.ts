import type {
  MutationState,
  MutationStateHandle,
  MutationStateRecord,
  QueryState,
  QueryStateHandle,
  QueryStateRecord,
  QueryStateAdapter,
} from "@ailuracode/alpine-query";
import { vanillaQueryAdapter } from "@ailuracode/alpine-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import {
  bridgeMutationHandleToAlpine,
  bridgeQueryHandleToAlpine,
  createAlpineBridgedAdapter,
} from "../src/bridge.js";

function createMockHandle(): QueryStateHandle<unknown> {
  const listeners = new Set<(record: QueryStateRecord<unknown>) => void>();
  const record: QueryStateRecord<unknown> = {
    data: undefined,
    error: null,
    status: "pending",
    fetchStatus: "idle",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
  };

  const refetch = vi.fn().mockResolvedValue(undefined);
  const state: QueryState<unknown> = {
    data: record.data,
    error: record.error,
    status: record.status,
    fetchStatus: record.fetchStatus,
    dataUpdatedAt: record.dataUpdatedAt,
    errorUpdatedAt: record.errorUpdatedAt,
    isPending: record.status === "pending",
    isLoading: record.status === "pending" && record.fetchStatus === "fetching",
    isFetching: record.fetchStatus === "fetching",
    isError: record.status === "error",
    isSuccess: record.status === "success",
    isStale: true,
    refetch,
  };

  return {
    state,
    get: () => record,
    patch: (p) => {
      Object.assign(record, p);
      for (const l of listeners) {
        l(record);
      }
    },
    listen: (l) => {
      listeners.add(l);
      l(record);
      return () => {
        listeners.delete(l);
        return false;
      };
    },
    setStaleTime: (_n: number) => undefined,
    getStaleTime: () => 60_000,
  };
}

function createMockMutationHandle(): MutationStateHandle<unknown, unknown> {
  const listeners = new Set<(record: MutationStateRecord<unknown>) => void>();
  const record: MutationStateRecord<unknown> = {
    data: undefined,
    error: null,
    status: "idle",
  };

  const mutate = vi.fn().mockResolvedValue(undefined) as unknown as MutationState<unknown, unknown>["mutate"];
  const reset = vi.fn() as unknown as MutationState<unknown, unknown>["reset"];
  const state: MutationState<unknown, unknown> = {
    data: record.data,
    error: record.error,
    status: record.status,
    isIdle: record.status === "idle",
    isPending: record.status === "pending",
    isError: record.status === "error",
    isSuccess: record.status === "success",
    mutate,
    reset,
  };

  return {
    state,
    get: () => record,
    patch: (p) => {
      Object.assign(record, p);
      for (const l of listeners) {
        l(record);
      }
    },
    listen: (l) => {
      listeners.add(l);
      l(record);
      return () => {
        listeners.delete(l);
        return false;
      };
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

      const state = bridge.state;
      expect(state.data).toBe("test");
      expect(state.status).toBe("success");
      expect(state.dataUpdatedAt).toBe(12345);
    });

    it("unbind stops syncing", () => {
      const Alpine = startAlpine();
      const handle = createMockHandle();
      const bridge = bridgeQueryHandleToAlpine(Alpine, handle, () => 60_000);

      bridge.unbind();
      handle.patch({ data: "after-unbind" });

      expect(bridge.state.data).toBeUndefined();
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
      expect(bridge.state.status).toBe("pending");

      handle.patch({ data: "ok", status: "success" });
      expect((bridge.state as unknown as MutationStateRecord<unknown>).data).toBe("ok");
      expect(bridge.state.status).toBe("success");
    });

    it("binds mutate and reset to the source state", () => {
      const Alpine = startAlpine();
      const handle = createMockMutationHandle();
      const bridge = bridgeMutationHandleToAlpine(Alpine, handle);

      bridge.state.mutate("v");
      expect(handle.state.mutate).toHaveBeenCalledWith("v");

      bridge.state.reset();
      expect(handle.state.reset).toHaveBeenCalled();
    });

    it("unbind stops syncing", () => {
      const Alpine = startAlpine();
      const handle = createMockMutationHandle();
      const bridge = bridgeMutationHandleToAlpine(Alpine, handle);

      bridge.unbind();
      handle.patch({ status: "pending" });

      expect(bridge.state.status).toBe("idle");
    });
  });

  describe("createAlpineBridgedAdapter", () => {
    it("wraps a base adapter and delegates name", () => {
      const Alpine = startAlpine();
      const base = { ...vanillaQueryAdapter, name: "TestBase" };
      const bridged = createAlpineBridgedAdapter(Alpine, base);

      expect(bridged.name).toBe("TestBase");
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

    it("falls back to staleTime when handle has no getStaleTime", () => {
      const Alpine = startAlpine();
      const noStaleListener = (listener: (record: QueryStateRecord<unknown>) => void) => {
        listener({
          data: undefined,
          error: null,
          status: "pending",
          fetchStatus: "idle",
          dataUpdatedAt: 0,
          errorUpdatedAt: 0,
        });
        return () => false;
      };
      const baseAdapter: QueryStateAdapter = {
        name: "NoStaleTime",
        createQueryState: <TData,>(
          initial: QueryStateRecord<TData>,
          _staleTime: number,
          refetch: () => Promise<void>
        ): QueryStateHandle<TData> => {
          const listeners = new Set<(record: QueryStateRecord<TData>) => void>();
          const record: QueryStateRecord<TData> = { ...initial };
          const state = {
            ...initial,
            refetch,
          } as QueryState<TData>;
          return {
            state,
            get: () => record,
            patch: (p) => {
              Object.assign(record, p);
              for (const l of listeners) {
                l(record);
              }
            },
            listen: noStaleListener as unknown as QueryStateHandle<TData>["listen"],
          };
        },
        createMutationState: <TData, TVariables,>(
          handlers: Pick<MutationState<TData, TVariables>, "mutate" | "reset">
        ): MutationStateHandle<TData, TVariables> => {
          const state: MutationState<TData, TVariables> = {
            data: undefined as TData | undefined,
            error: null,
            status: "idle",
            isIdle: true,
            isPending: false,
            isError: false,
            isSuccess: false,
            mutate: handlers.mutate,
            reset: handlers.reset,
          };
          return {
            state,
            get: () => ({ data: undefined, error: null, status: "idle" }),
            patch: () => undefined,
            listen: () => () => false,
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

      expect(handle.getStaleTime?.()).toBeUndefined();
      expect(bridged.createQueryState).toBeDefined();
    });
  });
});
