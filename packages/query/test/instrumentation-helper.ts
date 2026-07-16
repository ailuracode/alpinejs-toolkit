import { createQueryDevtoolsInstrumentation } from "../src/instrumentation-factory.js";

export function createTestQueryInstrumentation() {
  return createQueryDevtoolsInstrumentation();
}
