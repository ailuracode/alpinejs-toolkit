import type { QueryClientOptions } from "@ailuracode/alpine-query";
import type { QueryRegisterOptions } from "@ailuracode/alpine-query-adapter-alpine";
import { createQueryDevtoolsInstrumentation } from "../../query/src/instrumentation-factory.js";

const devtoolsInstrumentation = createQueryDevtoolsInstrumentation();

export function withDevtoolsInstrumentation(options: QueryRegisterOptions): QueryRegisterOptions {
  return {
    ...options,
    instrumentation: devtoolsInstrumentation,
  };
}

export function withDevtoolsClient(options: QueryClientOptions = {}): QueryClientOptions {
  return {
    ...options,
    instrumentation: devtoolsInstrumentation,
  };
}

export function withDevtoolsClientInstrumentation(
  options: QueryClientOptions & Pick<QueryRegisterOptions, "adapter">
): QueryClientOptions {
  return {
    ...options,
    instrumentation: devtoolsInstrumentation,
  };
}
