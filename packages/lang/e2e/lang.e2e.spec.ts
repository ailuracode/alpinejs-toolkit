import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-lang", () => {
  test("changes language through the store", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Set Spanish" }).click();
    await expect(page.locator("#lang-current")).toHaveText("es-es");
  });

  test("resets to the detected language", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const initial = await page.locator("#lang-current").textContent();
    await page.getByRole("button", { name: "Set Spanish" }).click();
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.locator("#lang-current")).toHaveText(initial ?? "");
  });
});
