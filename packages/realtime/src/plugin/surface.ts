import type { Alpine } from "alpinejs";
import type { RealtimeController } from "../controller/RealtimeController";
import type { RealtimeControllerConfig } from "../controller/RealtimeControllerConfig";
import type { RealtimeControllerState } from "../controller/RealtimeControllerState";

export const REALTIME_STORE_KEY = "realtime";
export const REALTIME_MAGIC_KEY = "realtime";

export interface RealtimeStore {
  state: RealtimeControllerState;
  readonly isReady: boolean;
}

export interface RealtimeMagic {
  readonly controller: RealtimeController;
  readonly state: RealtimeControllerState;
  readonly isReady: boolean;
  connect(overrides?: RealtimeControllerConfig): Promise<void>;
  disconnect(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  destroy(): Promise<void>;
  subscribe(
    channel: string,
    handler: (message: import("../controller/RealtimeMessage").RealtimeMessage) => void
  ): () => void;
  unsubscribe(
    channel: string,
    handler?: (message: import("../controller/RealtimeMessage").RealtimeMessage) => void
  ): void;
  publish(
    channel: string,
    message: import("../controller/RealtimeMessage").RealtimeMessage
  ): Promise<void>;
  getState(): RealtimeControllerState;
  on<Key extends keyof import("../controller/RealtimeEvents").RealtimeEvents>(
    event: Key,
    handler: (detail: import("../controller/RealtimeEvents").RealtimeEvents[Key]) => void
  ): () => void;
  off<Key extends keyof import("../controller/RealtimeEvents").RealtimeEvents>(
    event: Key,
    handler: (detail: import("../controller/RealtimeEvents").RealtimeEvents[Key]) => void
  ): void;
}

export type RealtimeAlpine = Alpine & {
  cleanup?: (callback: () => void) => void;
};

export type RealtimePluginCallback = (alpine: Alpine) => void;

export function createRealtimeStore(controller: RealtimeController): RealtimeStore {
  return {
    state: controller.state,
    get isReady(): boolean {
      return controller.state.status === "connected";
    },
  };
}

export function createRealtimeMagic(controller: RealtimeController): RealtimeMagic {
  return {
    controller,
    get state(): RealtimeControllerState {
      return controller.state;
    },
    get isReady(): boolean {
      return controller.state.status === "connected";
    },
    async connect(_overrides?: RealtimeControllerConfig): Promise<void> {
      await controller.connect();
    },
    async disconnect(): Promise<void> {
      await controller.disconnect();
    },
    async pause(): Promise<void> {
      await controller.pause();
    },
    async resume(): Promise<void> {
      await controller.resume();
    },
    async destroy(): Promise<void> {
      await controller.destroy();
    },
    subscribe: (channel, handler) => controller.subscribe(channel, handler),
    unsubscribe: (channel, handler) => controller.unsubscribe(channel, handler),
    publish: (channel, message) => controller.publish(channel, message),
    getState: () => controller.state,
    on: (event, handler) => controller.on(event, handler),
    off: (event, handler) => controller.off(event, handler),
  };
}
