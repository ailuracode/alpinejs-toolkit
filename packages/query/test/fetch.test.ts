import { HttpError, typedFetch } from "@ailuracode/alpine-query";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

type Todo = { id: number; title: string };

describe("typedFetch", () => {
  it("returns parsed JSON for successful responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, title: "Learn" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const data = await typedFetch<Todo[]>("/api/todos", { fetcher });

    expect(fetcher).toHaveBeenCalledWith("/api/todos", {});
    expect(data).toEqual([{ id: 1, title: "Learn" }]);
  });

  it("throws HttpError for non-OK responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response("Not found", {
        status: 404,
        statusText: "Not Found",
      })
    );

    const error = await typedFetch("/api/todos", { fetcher }).catch((caught) => caught);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(404);
  });

  it("returns undefined for 204 responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    const data = await typedFetch<void>("/api/todos/1", { method: "DELETE", fetcher });

    expect(data).toBeUndefined();
  });

  it("supports custom parsers", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("plain-text", { status: 200 }));
    const parse = vi.fn(async (response: Response) => response.text());

    const data = await typedFetch<string>("/api/ping", { fetcher, parse });

    expect(parse).toHaveBeenCalledOnce();
    expect(data).toBe("plain-text");
  });

  it("forwards request init to fetch", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await typedFetch<{ ok: boolean }>("/api/todos", {
      fetcher,
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
    });

    expect(fetcher).toHaveBeenCalledWith("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
    });
  });

  it("infers the response generic", () => {
    expectTypeOf(typedFetch<Todo[]>).returns.resolves.toEqualTypeOf<Todo[]>();
  });
});
