import type { PermissionError } from "./errors.js";

export type NormalizedPermissionState = "granted" | "prompt" | "denied" | "unknown";

export type PermissionAvailability =
  | "available"
  | "unsupported"
  | "insecure-context"
  | "policy-blocked"
  | "platform-restricted";

export type PermissionRequestState = "idle" | "requesting" | "succeeded" | "failed";

export interface PermissionSnapshot<TResult = unknown> {
  readonly permission: NormalizedPermissionState;
  readonly availability: PermissionAvailability;
  readonly requestState: PermissionRequestState;
  readonly canRequest: boolean;
  readonly requiresUserGesture: boolean;
  readonly error: PermissionError | null;
  readonly result: TResult | null;
}

export interface PermissionRequestResult<TResult = unknown> {
  readonly permission: NormalizedPermissionState;
  readonly result?: TResult;
  readonly error?: PermissionError;
}

export type PermissionListener<TResult = unknown> = (snapshot: PermissionSnapshot<TResult>) => void;

export interface PermissionAdapter<
  TName extends string = string,
  TResult = unknown,
  TOptions = unknown,
> {
  readonly name: TName;
  readonly requiresUserGesture?: boolean;

  isSupported(): boolean;
  getAvailability(): PermissionAvailability;
  query(): Promise<NormalizedPermissionState>;
  request(options?: TOptions): Promise<PermissionRequestResult<TResult>>;
  subscribe?(listener: PermissionListener<TResult>): Promise<() => void> | (() => void);
}

export type PermissionRegistry = Readonly<Record<string, PermissionSnapshot>>;

export interface PermissionsPluginOptions {
  readonly controller?: PermissionsController;
  readonly adapters?: readonly PermissionAdapter[];
  /**
   * `$store` key the Alpine plugin registers under. Defaults to
   * {@link DEFAULT_PERMISSIONS_STORE_KEY}. Set when the host already
   * owns a `permissions` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the controller. Ignored by the standalone
   * `createPermissions` factory.
   */
  readonly storeKey?: string;
  /**
   * `$permissions` magic key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_PERMISSIONS_MAGIC_KEY}, or to `storeKey`
   * when that is renamed (the magic follows the store so consumers
   * only rename one). Ignored by the standalone factory.
   */
  readonly magicKey?: string;
}

/** Default `$store` key registered by {@link permissionsPlugin}. */
export const DEFAULT_PERMISSIONS_STORE_KEY = "permissions";

/** Default `$permissions` magic key registered by {@link permissionsPlugin}. */
export const DEFAULT_PERMISSIONS_MAGIC_KEY = "permissions";

export interface PermissionsMagic {
  readonly registry: PermissionRegistry;
  get(name: string): PermissionSnapshot | undefined;
  query(name: string): Promise<PermissionSnapshot>;
  request(name: string, options?: unknown): Promise<PermissionSnapshot>;
  refresh(name: string): Promise<PermissionSnapshot>;
  watch(name: string): Promise<() => void>;
}

export interface PermissionsStore extends PermissionsMagic {
  register(adapter: PermissionAdapter): () => void;
}

import type { PermissionsController } from "./controller.js";
