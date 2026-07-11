import { BaseController } from "@ailuracode/alpine-core";
import { PermissionError } from "./errors.js";
import { createInitialSnapshot, deriveCanRequest, normalizePermissionState } from "./snapshot.js";
import type {
  NormalizedPermissionState,
  PermissionAdapter,
  PermissionListener,
  PermissionRegistry,
  PermissionRequestResult,
  PermissionSnapshot,
} from "./types.js";

export interface PermissionsEvents extends Record<string, unknown> {
  change: {
    name: string;
    snapshot: PermissionSnapshot;
  };
}

interface AdapterEntry {
  adapter: PermissionAdapter;
  snapshot: PermissionSnapshot;
  queryGeneration: number;
  requestGeneration: number;
  pendingRequest: Promise<PermissionSnapshot> | null;
  unsubscribe: (() => void) | null;
}

/**
 * Framework-agnostic permission registry. Adapters are registered explicitly
 * and never trigger native prompts during construction or registration.
 */
export class PermissionsController extends BaseController<PermissionsEvents> {
  readonly #entries = new Map<string, AdapterEntry>();

  register<TName extends string>(adapter: PermissionAdapter<TName>): () => void {
    if (this.isDestroyed) {
      throw new PermissionError("Cannot register adapter after destroy()", "PERMISSION_DESTROYED");
    }

    if (this.#entries.has(adapter.name)) {
      throw new PermissionError(
        `Permission adapter "${adapter.name}" is already registered`,
        "PERMISSION_CONCURRENT_REQUEST",
        { permissionName: adapter.name }
      );
    }

    const availability = adapter.getAvailability();
    const entry: AdapterEntry = {
      adapter,
      snapshot: createInitialSnapshot(availability, {
        requiresUserGesture: adapter.requiresUserGesture ?? true,
      }),
      queryGeneration: 0,
      requestGeneration: 0,
      pendingRequest: null,
      unsubscribe: null,
    };

    entry.snapshot = {
      ...entry.snapshot,
      canRequest: deriveCanRequest(entry.snapshot),
    };

    this.#entries.set(adapter.name, entry);

    return () => {
      this.unregister(adapter.name);
    };
  }

  unregister(name: string): boolean {
    const entry = this.#entries.get(name);
    if (!entry) {
      return false;
    }

    entry.unsubscribe?.();
    entry.unsubscribe = null;
    this.#entries.delete(name);
    return true;
  }

  get(name: string): PermissionSnapshot | undefined {
    return this.#entries.get(name)?.snapshot;
  }

  getRegistry(): PermissionRegistry {
    const registry: Record<string, PermissionSnapshot> = {};
    for (const [name, entry] of this.#entries) {
      registry[name] = entry.snapshot;
    }
    return registry;
  }

  query(name: string): Promise<PermissionSnapshot> {
    const entry = this.#requireEntry(name);
    const generation = ++entry.queryGeneration;
    return this.#runQuery(entry, generation);
  }

  async request(name: string, options?: unknown): Promise<PermissionSnapshot> {
    const entry = this.#requireEntry(name);

    if (entry.pendingRequest) {
      return await entry.pendingRequest;
    }

    const snapshot = entry.snapshot;
    if (!snapshot.canRequest && snapshot.permission === "denied") {
      return snapshot;
    }

    const generation = ++entry.requestGeneration;
    let pending: Promise<PermissionSnapshot>;
    pending = this.#runRequest(entry, generation, options).finally(() => {
      if (entry.pendingRequest === pending) {
        entry.pendingRequest = null;
      }
    });
    entry.pendingRequest = pending;

    return await pending;
  }

  refresh(name: string): Promise<PermissionSnapshot> {
    return this.query(name);
  }

  /**
   * Starts observing permission changes for a registered adapter.
   * Subscriptions are explicit and never begin during registration.
   */
  async watch(name: string): Promise<() => void> {
    const entry = this.#requireEntry(name);

    if (entry.unsubscribe) {
      return entry.unsubscribe;
    }

    const subscribe = entry.adapter.subscribe;
    if (!subscribe) {
      return () => {
        // No-op when the adapter does not expose change events.
      };
    }

    const listener: PermissionListener = (snapshot) => {
      this.#applySnapshot(entry, snapshot);
    };

    const unsubscribe = await subscribe(listener);
    const dispose = (): void => {
      unsubscribe();
      if (entry.unsubscribe === dispose) {
        entry.unsubscribe = null;
      }
    };

    entry.unsubscribe = dispose;
    this.registerCleanup(dispose);
    return dispose;
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    for (const entry of this.#entries.values()) {
      entry.unsubscribe?.();
      entry.unsubscribe = null;
    }

    this.#entries.clear();
    super.destroy();
  }

  #requireEntry(name: string): AdapterEntry {
    if (this.isDestroyed) {
      throw new PermissionError("PermissionsController is destroyed", "PERMISSION_DESTROYED");
    }

    const entry = this.#entries.get(name);
    if (!entry) {
      throw new PermissionError(
        `Permission "${name}" is not registered`,
        "PERMISSION_NOT_REGISTERED",
        { permissionName: name }
      );
    }

    return entry;
  }

  async #runQuery(entry: AdapterEntry, generation: number): Promise<PermissionSnapshot> {
    const { adapter } = entry;
    const availability = adapter.getAvailability();

    if (availability !== "available") {
      const snapshot = createInitialSnapshot(availability, {
        requiresUserGesture: adapter.requiresUserGesture ?? true,
        permission: "denied",
      });
      return this.#commitSnapshot(entry, generation, snapshot, "query");
    }

    try {
      const permission = normalizePermissionState(await adapter.query());
      const snapshot: PermissionSnapshot = {
        ...entry.snapshot,
        permission,
        availability,
        requestState: "idle",
        error: null,
        canRequest: deriveCanRequest({
          permission,
          availability,
          requestState: "idle",
        }),
      };
      return this.#commitSnapshot(entry, generation, snapshot, "query");
    } catch (error) {
      const snapshot: PermissionSnapshot = {
        ...entry.snapshot,
        permission: "unknown",
        availability,
        requestState: "failed",
        error: this.#toError(adapter.name, error),
        canRequest: false,
      };
      return this.#commitSnapshot(entry, generation, snapshot, "query");
    }
  }

  async #runRequest(
    entry: AdapterEntry,
    generation: number,
    options?: unknown
  ): Promise<PermissionSnapshot> {
    const { adapter } = entry;
    const name = adapter.name;
    const availability = adapter.getAvailability();

    if (availability !== "available") {
      const snapshot = {
        ...entry.snapshot,
        availability,
        permission: "denied" as const,
        requestState: "failed" as const,
        canRequest: false,
        error: this.#availabilityError(name, availability),
      };
      return this.#commitSnapshot(entry, generation, snapshot, "request");
    }

    if (!adapter.isSupported()) {
      const snapshot: PermissionSnapshot = {
        ...entry.snapshot,
        availability: "unsupported",
        permission: "denied",
        requestState: "failed",
        canRequest: false,
        error: new PermissionError(
          `Permission "${name}" is not supported`,
          "PERMISSION_UNSUPPORTED",
          { permissionName: name }
        ),
      };
      return this.#commitSnapshot(entry, generation, snapshot, "request");
    }

    const requestingSnapshot: PermissionSnapshot = {
      ...entry.snapshot,
      requestState: "requesting",
      canRequest: false,
      error: null,
    };
    this.#applySnapshot(entry, requestingSnapshot);

    try {
      const result = await adapter.request(options);
      const permission = normalizePermissionState(result.permission);
      const snapshot: PermissionSnapshot = {
        ...entry.snapshot,
        permission,
        availability,
        requestState: "idle",
        result: result.result ?? null,
        error: result.error ?? null,
        canRequest: deriveCanRequest({
          permission,
          availability,
          requestState: "idle",
        }),
      };
      return this.#commitSnapshot(entry, generation, snapshot, "request");
    } catch (error) {
      const snapshot: PermissionSnapshot = {
        ...entry.snapshot,
        permission: "denied",
        requestState: "failed",
        canRequest: false,
        error: this.#toError(name, error),
      };
      return this.#commitSnapshot(entry, generation, snapshot, "request");
    }
  }

  #commitSnapshot(
    entry: AdapterEntry,
    generation: number,
    snapshot: PermissionSnapshot,
    kind: "query" | "request"
  ): PermissionSnapshot {
    const currentGeneration = kind === "query" ? entry.queryGeneration : entry.requestGeneration;

    if (generation !== currentGeneration) {
      return entry.snapshot;
    }

    this.#applySnapshot(entry, snapshot);
    return entry.snapshot;
  }

  #applySnapshot(entry: AdapterEntry, snapshot: PermissionSnapshot): void {
    entry.snapshot = {
      ...snapshot,
      canRequest: deriveCanRequest(snapshot),
    };
    this.emit("change", { name: entry.adapter.name, snapshot: entry.snapshot });
  }

  #availabilityError(
    name: string,
    availability: PermissionSnapshot["availability"]
  ): PermissionError {
    const codeByAvailability = {
      available: "PERMISSION_UNSUPPORTED",
      unsupported: "PERMISSION_UNSUPPORTED",
      "insecure-context": "PERMISSION_INSECURE_CONTEXT",
      "policy-blocked": "PERMISSION_POLICY_BLOCKED",
      "platform-restricted": "PERMISSION_PLATFORM_RESTRICTED",
    } as const;

    const code = codeByAvailability[availability];
    const messageByAvailability = {
      available: `Permission "${name}" is unavailable`,
      unsupported: `Permission "${name}" is not supported`,
      "insecure-context": `Permission "${name}" requires a secure context`,
      "policy-blocked": `Permission "${name}" is blocked by Permissions Policy`,
      "platform-restricted": `Permission "${name}" is restricted on this platform`,
    } as const;

    return new PermissionError(messageByAvailability[availability], code, {
      permissionName: name,
    });
  }

  #toError(name: string, error: unknown): PermissionError {
    if (error instanceof PermissionError) {
      return error;
    }

    const message = error instanceof Error ? error.message : `Permission "${name}" request failed`;
    return new PermissionError(message, "PERMISSION_REQUEST_FAILED", {
      cause: error,
      permissionName: name,
    });
  }
}

/** Creates a {@link PermissionsController} instance. */
export function createPermissions(): PermissionsController {
  return new PermissionsController();
}

export type { NormalizedPermissionState, PermissionRequestResult, PermissionSnapshot };
