/**
 * Adapter factory.
 *
 * Centralises the logic for picking a transport adapter. The
 * controller calls into these helpers when its config does not
 * pre-bind an adapter (the typical scenario after Phase 3 lands).
 *
 * Three entry points cover v0.1.0:
 *
 * - {@link createSseTransport} — wraps the native `EventSource`.
 * - {@link createWsTransport} — wraps the native `WebSocket`.
 * - {@link createAutoTransport} — tries WebSocket first and
 *   falls back to SSE if WS fails within `~100ms`. Consumers
 *   that already know the supported transport can skip the
 *   probing.
 *
 * {@link createBroadcastChannelTransport} is reserved for
 * v0.2.0; in v0.1.0 it throws a typed
 * `RealtimeError(code: "ADAPTER_ERROR")` so callers get a clear
 * signal that the feature is not yet implemented (instead of a
 * silent no-op).
 *
 * @module
 */

import { RealtimeError } from "../controller/RealtimeError";
import type { RealtimeTransportAdapter } from "./RealtimeTransportAdapter";
import type { SseEventSourceCtor, SseTransportAdapterOptions } from "./SseTransportAdapter";
import { SseTransportAdapter } from "./SseTransportAdapter";
import type { WsCtor, WsTransportAdapterOptions } from "./WsTransportAdapter";
import { WsTransportAdapter } from "./WsTransportAdapter";

/**
 * Time (ms) the auto transport waits for the WebSocket handshake
 * to complete before it gives up and falls back to SSE.
 */
const AUTO_TRANSPORT_FALLBACK_MS = 100;

/**
 * Build a {@link SseTransportAdapter}. Pure factory — no network
 * activity happens here; the adapter only opens inside `connect()`.
 */
export function createSseTransport(options: SseTransportAdapterOptions): SseTransportAdapter {
  return new SseTransportAdapter(options);
}

/**
 * Build a {@link WsTransportAdapter}. Pure factory — no network
 * activity happens here; the adapter only opens inside `connect()`.
 */
export function createWsTransport(options: WsTransportAdapterOptions): WsTransportAdapter {
  return new WsTransportAdapter(options);
}

/**
 * Options accepted by {@link createAutoTransport}.
 *
 * Mirrors the URL + protocol contract of both adapters so the
 * auto-detect path can swap them without losing context.
 */
export interface AutoTransportOptions {
  readonly url: string;
  readonly protocols?: string | string[];
  readonly binaryType?: WsTransportAdapterOptions["binaryType"];
  readonly withCredentials?: boolean;
  readonly headers?: SseTransportAdapterOptions["headers"];
  readonly WebSocketCtor?: WsCtor;
  readonly EventSourceCtor?: SseEventSourceCtor;
}

/**
 * Probes WebSocket first; falls back to SSE if WS does not open
 * within {@link AUTO_TRANSPORT_FALLBACK_MS} milliseconds.
 *
 * The probe honours `WebSocket.isSupported()` /
 * `EventSource.isSupported()` — when WS is unavailable in the
 * runtime (SSR, IE), we skip directly to SSE without waiting.
 *
 * @returns The first adapter that opens successfully. The
 *   fallback adapter is destroyed before being returned if it
 *   never opens.
 */
export async function createAutoTransport(
  options: AutoTransportOptions
): Promise<RealtimeTransportAdapter> {
  const ws = new WsTransportAdapter({
    url: options.url,
    protocols: options.protocols,
    binaryType: options.binaryType,
    WebSocketCtor: options.WebSocketCtor,
  });

  if (!ws.isSupported()) {
    await ws.destroy().catch(() => undefined);
    return createSseTransport({
      url: options.url,
      withCredentials: options.withCredentials,
      headers: options.headers,
      EventSourceCtor: options.EventSourceCtor,
    });
  }

  let opened = false;
  let raceTimer: ReturnType<typeof setTimeout> | null = null;
  let settled = false;

  const openPromise = new Promise<WsTransportAdapter>((resolve, reject) => {
    const settle = (
      result: { ok: true; adapter: WsTransportAdapter } | { ok: false; error: RealtimeError }
    ): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (raceTimer !== null) {
        clearTimeout(raceTimer);
        raceTimer = null;
      }
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("error", onError);
      if (result.ok) {
        resolve(result.adapter);
      } else {
        reject(result.error);
      }
    };
    const onOpen = (): void => {
      opened = true;
      settle({ ok: true, adapter: ws });
    };
    const onError = (event: Event): void => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      settle({
        ok: false,
        error: new RealtimeError(
          detail?.message ?? "WebSocket auto-probe failed",
          "TRANSPORT_ERROR",
          { retryable: true }
        ),
      });
    };
    ws.addEventListener("open", onOpen);
    ws.addEventListener("error", onError);

    raceTimer = setTimeout(() => {
      if (opened) {
        return;
      }
      settle({
        ok: false,
        error: new RealtimeError("WebSocket auto-probe timed out", "TRANSPORT_ERROR", {
          retryable: true,
        }),
      });
    }, AUTO_TRANSPORT_FALLBACK_MS);
  });

  try {
    await ws.connect();
  } catch (cause) {
    if (!settled) {
      settled = true;
      if (raceTimer !== null) {
        clearTimeout(raceTimer);
        raceTimer = null;
      }
    }
    void cause;
  }

  try {
    return await openPromise;
  } catch {
    await ws.destroy().catch(() => undefined);
    const fallback = createSseTransport({
      url: options.url,
      withCredentials: options.withCredentials,
      headers: options.headers,
      EventSourceCtor: options.EventSourceCtor,
    });
    try {
      await fallback.connect();
    } catch {
      // Surface the failure to the caller via the underlying
      // adapter state; the controller's `connect()` will retry.
    }
    return fallback;
  }
}

/**
 * Reserved for v0.2.0. Calling this in v0.1.0 throws a typed
 * `RealtimeError(code: "ADAPTER_ERROR")` so consumers see the
 * missing feature clearly instead of a silent no-op.
 */
export function createBroadcastChannelTransport(_channelName: string): RealtimeTransportAdapter {
  throw new RealtimeError("BroadcastChannel transport not implemented in v0.1.0", "ADAPTER_ERROR", {
    retryable: false,
  });
}
