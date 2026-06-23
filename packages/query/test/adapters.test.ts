import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nanostoresQueryAdapter } from "../src/adapters/nanostores.js";
import { vanillaQueryAdapter } from "../src/adapters/vanilla.js";
import { createQueryClient } from "../src/client.js";

describe("query state adapters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["vanilla", vanillaQueryAdapter],
    ["nanostores", nanostoresQueryAdapter],
  ])("%s adapter powers createQueryClient()", async (_name, adapter) => {
    const client = createQueryClient({ adapter });
    const queryFn = vi.fn().mockResolvedValue("ok");
    const query = client.observe(["adapter"], queryFn);

    await vi.runAllTimersAsync();

    expect(query.isSuccess).toBe(true);
    expect(query.data).toBe("ok");
    query.destroy();
    client.reset();
  });
});
