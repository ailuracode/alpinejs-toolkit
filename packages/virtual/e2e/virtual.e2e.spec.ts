import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-virtual", () => {
  test("renders only a window of items for a large list", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const rendered = Number(await page.locator("#virtual-count").textContent());
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(100);
    await expect(page.getByText("Row 0")).toBeVisible();
  });

  test("updates the visible range on scroll", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const before = Number(await page.locator("#virtual-count").textContent());
    await page.locator("#virtual-scroll").evaluate((el) => {
      el.scrollTop = 800;
      el.dispatchEvent(new Event("scroll"));
    });
    const after = Number(await page.locator("#virtual-count").textContent());
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThanOrEqual(before);
  });
});
