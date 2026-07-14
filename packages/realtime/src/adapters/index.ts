/**
 * Public adapter surface for `@ailuracode/alpine-realtime`.
 *
 * Mirrors the layout used in sibling packages: implementations
 * live in this directory, this barrel only re-exports them.
 * Consumers import named bindings from
 * `@ailuracode/alpine-realtime` or
 * `@ailuracode/alpine-realtime/adapters`.
 */

export type {
  RealtimeAdapterEvent,
  RealtimeAdapterReadyState,
  RealtimeTransportAdapter,
  TransportAdapterOptions,
} from "./RealtimeTransportAdapter";
export {
  type SseEventSourceCtor,
  type SseEventSourceLike,
  SseTransportAdapter,
  type SseTransportAdapterOptions,
} from "./SseTransportAdapter";
export {
  type AutoTransportOptions,
  createAutoTransport,
  createBroadcastChannelTransport,
  createSseTransport,
  createWsTransport,
} from "./TransportAdapterFactory";
export {
  type WsBinaryType,
  type WsCtor,
  type WsLike,
  WsTransportAdapter,
  type WsTransportAdapterOptions,
} from "./WsTransportAdapter";
