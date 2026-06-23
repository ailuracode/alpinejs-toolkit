import { createQueryClient } from "@ailuracode/alpine-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nanostoresQueryAdapter } from "../src/adapter.js";

describe("@ailuracode/alpine-query-adapter-nanostores", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("nanostoresQueryAdapter powers createQueryClient()", async () => {
    const client = createQueryClient({ adapter: nanostoresQueryAdapter });
    const queryFn = vi.fn().mockResolvedValue("ok");
    const query = client.observe(["adapter"], queryFn);

    await vi.runAllTimersAsync();

    expect(query.isSuccess).toBe(true);
    expect(query.data).toBe("ok");
    query.destroy();
    client.reset();
  });
});
