import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-accordion", () => {
  test("toggles panel visibility", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#accordion-panel")).toBeHidden();
    await page.getByRole("button", { name: "Section 1" }).click();
    await expect(page.locator("#accordion-panel")).toBeVisible();
    await expect(page.locator("#accordion-open")).toHaveText("true");
  });

  test("exposes aria-expanded on the trigger", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#accordion-open")).toHaveText("false");
    await page.getByRole("button", { name: "Section 1" }).click();
    await expect(page.locator("#accordion-open")).toHaveText("true");
  });
});
