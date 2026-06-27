import jsonApiPlugin, {
  createJsonApiClient,
  defineJsonApiSchema,
} from "@ailuracode/alpinejs-json-api";
import { describe, expect, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";

const schema = defineJsonApiSchema({
  articles: {
    attributes: {} as { title: string },
  },
});

describe("@ailuracode/alpinejs-json-api plugin", () => {
  it("registers $jsonapi magic with a typed client", () => {
    const client = createJsonApiClient(schema, { baseUrl: "http://example.com" });
    const { jsonapi } = createMagicHarness(
      jsonApiPlugin({ schema, baseUrl: "http://example.com" })
    ) as { jsonapi: typeof client };

    expect(jsonapi.schema).toBe(schema);
    expect(typeof jsonapi.findAll).toBe("function");
    expect(typeof jsonapi.findOne).toBe("function");
  });
});
