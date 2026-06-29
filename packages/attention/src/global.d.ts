/// <reference types="@types/alpinejs" />

export type IdleUserState = "active" | "idle";
export type IdleScreenState = "locked" | "unlocked";

export interface WakeLockMagic {
  error: string | null;
  isRequesting: boolean;
  isActive: boolean;
  readonly isSupported: boolean;
  request(): Promise<boolean>;
  release(): Promise<boolean>;
}

export interface IdleMagic {
  userState: IdleUserState | null;
  screenState: IdleScreenState | null;
  permission: PermissionState | null;
  error: string | null;
  threshold: number;
  isLoading: boolean;
  isWatching: boolean;
  readonly isSupported: boolean;
  readonly isActive: boolean;
  readonly isIdle: boolean;
  requestPermission(): Promise<PermissionState>;
  start(options?: { threshold?: number }): Promise<boolean>;
  stop(): boolean;
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $wakelock: WakeLockMagic;
      $idle: IdleMagic;
    }
  }
}
