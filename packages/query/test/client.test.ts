import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../src/client.js";
import type { QueryStore } from "../src/types.js";

type Todo = { id: number; title: string };

describe("createQueryClient()", () => {
  let client: QueryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    client = createQueryClient();
  });

  afterEach(() => {
    client.reset();
    vi.useRealTimers();
  });

  it("works without Alpine.js", async () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 1, title: "Learn Alpine Query" }]);
    const query = client.observe<Todo[]>(["todos"], queryFn);

    expect(query.isLoading).toBe(true);

    await vi.runAllTimersAsync();

    expect(query.isSuccess).toBe(true);
    expect(query.data).toEqual([{ id: 1, title: "Learn Alpine Query" }]);
    query.destroy();
  });

  it("exposes devtools API", () => {
    expect(typeof client.devtools.subscribe).toBe("function");
    expect(typeof client.devtools.getSnapshot).toBe("function");
  });

  it("supports mutations without Alpine.js", async () => {
    const mutation = client.mutate({
      mutationFn: async (title: string) => `created:${title}`,
    });

    const result = await mutation.mutate("Task");

    expect(result).toBe("created:Task");
    expect(mutation.isSuccess).toBe(true);
  });
});
