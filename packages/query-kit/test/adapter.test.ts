import { createQueryClient } from "@ailuracode/alpine-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nanostoresQueryAdapter } from "../src/nanostores/adapter.js";

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

  it("clears mutation data when reset() patches undefined", async () => {
    const client = createQueryClient({ adapter: nanostoresQueryAdapter });
    const mutation = client.mutate<string, string>({
      mutationFn: async (value) => `done:${value}`,
    });

    await mutation.mutate("test");
    expect(mutation.data).toBe("done:test");
    expect(mutation.status).toBe("success");

    mutation.reset();

    expect(mutation.data).toBeUndefined();
    expect(mutation.status).toBe("idle");
    client.reset();
  });
});
