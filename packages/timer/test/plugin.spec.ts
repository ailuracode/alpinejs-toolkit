/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import { describe, expect, it } from "vitest";
import { asAlpine, createMockAlpine } from "../../../test/mock-alpine";
import { timerPlugin } from "../src/plugin.js";

describe("timerPlugin — collision-avoidance keys", () => {
  it("registers under a custom magicKey", () => {
    const Alpine = createMockAlpine({ evaluateMagics: true });
    timerPlugin({ magicKey: "clock" })(asAlpine(Alpine));
    expect(Alpine.magics.clock).toBeDefined();
    expect(Alpine.magics.timer).toBeUndefined();
  });

  it("registers the timer magic surface", () => {
    const Alpine = createMockAlpine({ evaluateMagics: true });
    timerPlugin()(asAlpine(Alpine));
    const magic = Alpine.magics.timer as {
      create: (options?: unknown) => unknown;
      countdown: (options: unknown) => unknown;
      countup: (options?: unknown) => unknown;
      stopwatch: (options?: unknown) => unknown;
    };
    expect(magic.create).toBeTypeOf("function");
    expect(magic.countdown).toBeTypeOf("function");
    expect(magic.countup).toBeTypeOf("function");
    expect(magic.stopwatch).toBeTypeOf("function");
  });
});
