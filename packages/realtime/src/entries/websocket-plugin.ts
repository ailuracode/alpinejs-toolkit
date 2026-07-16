import { WsTransportAdapter } from "../adapters/WsTransportAdapter";
import type { RealtimeControllerConfig } from "../controller/RealtimeControllerConfig";
import { createRealtimePluginWithResolver } from "../plugin/register";

function resolveWebSocketAdapter(config: RealtimeControllerConfig) {
  if (config.adapter) {
    return Promise.resolve(config.adapter);
  }

  return Promise.resolve(
    new WsTransportAdapter({
      url: config.endpoint ?? "",
    })
  );
}

export function createRealtimeWebSocketPlugin(config: RealtimeControllerConfig = {}) {
  return createRealtimePluginWithResolver(resolveWebSocketAdapter, {
    ...config,
    transport: "websocket",
  });
}

export const realtimeWebSocketPlugin = createRealtimeWebSocketPlugin;
export default realtimeWebSocketPlugin;
