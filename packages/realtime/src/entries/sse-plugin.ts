import { SseTransportAdapter } from "../adapters/SseTransportAdapter";
import type { RealtimeControllerConfig } from "../controller/RealtimeControllerConfig";
import { createRealtimePluginWithResolver } from "../plugin/register";

function resolveSseAdapter(config: RealtimeControllerConfig) {
  if (config.adapter) {
    return Promise.resolve(config.adapter);
  }

  return Promise.resolve(
    new SseTransportAdapter({
      url: config.endpoint ?? "",
      withCredentials: false,
    })
  );
}

export function createRealtimeSsePlugin(config: RealtimeControllerConfig = {}) {
  return createRealtimePluginWithResolver(resolveSseAdapter, {
    ...config,
    transport: "sse",
  });
}

export const realtimeSsePlugin = createRealtimeSsePlugin;
export default realtimeSsePlugin;
