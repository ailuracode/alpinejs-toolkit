import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-geo", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 40.4168, longitude: -3.7038 });
  });

  test("requests the current position after user interaction", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Request position" }).click();
    await expect(page.locator("#geo-has")).toHaveText("true");
    await expect(page.locator("#geo-lat")).not.toHaveText("none");
    await expect(page.locator("#geo-lng")).not.toHaveText("none");
  });
});
