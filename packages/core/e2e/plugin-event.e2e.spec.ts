import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-core plugin events", () => {
  test("receives @toggle:change on the dispatch target element", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.locator("#dispatch-toggle").click();
    await expect(page.locator("#toggle-detail")).toHaveText(
      JSON.stringify({ previous: false, current: true, source: "toggle" })
    );
  });

  test("receives @theme:change.window from a window dispatch", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.locator("#dispatch-theme").click();
    await expect(page.locator("#theme-detail")).toHaveText(
      JSON.stringify({ previous: "light", current: "dark", source: "api" })
    );
  });

  test("bubbles namespaced events to parent Alpine listeners by default", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#parent-received")).toHaveText("no");
    await page.locator("#dispatch-bubbling").click();
    await expect(page.locator("#parent-received")).toHaveText("yes");
  });

  test("does not reach parent listeners when bubbling is disabled", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#parent-received")).toHaveText("no");
    await page.locator("#dispatch-no-bubble").click();
    await expect(page.locator("#parent-received")).toHaveText("no");
  });

  test("honors preventDefault on cancelable @dialog:before-close listeners", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.locator("#try-close").click();
    await expect(page.locator("#close-result")).toHaveText("blocked");
  });
});
