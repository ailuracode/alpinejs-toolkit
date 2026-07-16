import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-core", () => {
  test("initializes registered plugins through initPluginsSync", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("heading", { name: "Core E2E fixture" })).toBeVisible();
    await expect(page.locator("#resolved-theme")).toHaveText("light");
  });

  test("exposes plugin store behavior in real markup", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Toggle theme" }).click();
    await expect(page.locator("#resolved-theme")).toHaveText("dark");
    await expect(page.locator("html")).toHaveClass(/theme-dark/);
  });

  test("receives namespaced plugin events through Alpine listeners", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.locator("#dispatch-toggle").click();
    await expect(page.locator("#toggle-detail")).toHaveText(
      JSON.stringify({ previous: false, current: true, source: "toggle" })
    );

    await page.locator("#dispatch-theme").click();
    await expect(page.locator("#theme-detail")).toHaveText(
      JSON.stringify({ previous: "light", current: "dark", source: "api" })
    );
  });
});
