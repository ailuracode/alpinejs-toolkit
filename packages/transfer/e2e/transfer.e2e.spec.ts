import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-transfer", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("copies text through the clipboard magic", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Copy text" }).click();
    await expect(page.locator("#copy-state")).toHaveText("done");
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe("copied-text");
  });

  test("exports text and triggers a download", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export text" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("demo.txt");
    await expect(page.locator("#export-state")).toHaveText("done");
  });
});
