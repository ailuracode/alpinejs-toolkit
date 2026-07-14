import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-notify", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["notifications"]);
  });

  test("reports supported state and permission", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#notify-supported")).toHaveText("true");
    await expect(page.locator("#notify-permission")).not.toHaveText("");
  });

  test("sends a notification after user interaction", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Send notification" }).click();
    await expect(page.locator("#notify-sent")).not.toHaveText("idle");
  });
});
