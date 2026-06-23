import { createQueryClient } from "@ailuracode/alpine-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { zustandQueryAdapter } from "../src/adapter.js";

describe("@ailuracode/alpine-query-adapter-zustand", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("zustandQueryAdapter powers createQueryClient()", async () => {
    const client = createQueryClient({ adapter: zustandQueryAdapter });
    const queryFn = vi.fn().mockResolvedValue("ok");
    const query = client.observe(["adapter"], queryFn);

    await vi.runAllTimersAsync();

    expect(query.isSuccess).toBe(true);
    expect(query.data).toBe("ok");
    query.destroy();
    client.reset();
  });
});
