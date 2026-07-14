import type { StandardSchemaV1 } from "../../src/standard-schema.js";

export function createMockStandardSchema(
  validate: StandardSchemaV1["~standard"]["validate"]
): StandardSchemaV1 {
  return {
    "~standard": {
      version: 1,
      vendor: "mock",
      validate,
    },
  };
}
