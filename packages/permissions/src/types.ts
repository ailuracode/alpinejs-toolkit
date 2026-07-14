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
}

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
