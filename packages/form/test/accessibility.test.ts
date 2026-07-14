import { describe, expect, it } from "vitest";
import { buildErrorAnnouncement, createFieldAriaProps } from "../src/accessibility.js";

describe("@ailuracode/alpine-form accessibility", () => {
  it("exposes aria-invalid when errors exist", () => {
    expect(createFieldAriaProps(["Required"])).toEqual({
      "aria-invalid": true,
      "aria-describedby": undefined,
    });
  });

  it("links error descriptions", () => {
    expect(createFieldAriaProps(["Required"], { errorId: "email-error" })).toEqual({
      "aria-invalid": true,
      "aria-describedby": "email-error",
    });
  });

  it("builds live-region announcements", () => {
    const announcement = buildErrorAnnouncement(
      { email: ["Required"], "address.city": ["Invalid city"] },
      ["Form rejected"]
    );
    expect(announcement).toContain("Required");
    expect(announcement).toContain("Invalid city");
    expect(announcement).toContain("Form rejected");
  });
});
