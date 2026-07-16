import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-timer", () => {
  test("countdown displays remaining time and decreases while running", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const display = page.getByTestId("countdown-display");
    await expect(display).toHaveText("00:03");

    await page.getByRole("button", { name: "Start countdown" }).click();

    await expect
      .poll(async () => display.textContent(), {
        message: "countdown should tick down from the initial remaining value",
      })
      .not.toBe("00:03");

    await page.getByRole("button", { name: "Reset countdown" }).click();
    await expect(display).toHaveText("00:03");
  });

  test("stopwatch records laps while running", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const lapCount = page.getByTestId("lap-count");
    await expect(lapCount).toHaveText("0");

    await page.getByRole("button", { name: "Start stopwatch" }).click();
    await page.getByRole("button", { name: "Record lap" }).click();
    await expect(lapCount).toHaveText("1");

    await page.getByRole("button", { name: "Record lap" }).click();
    await expect(lapCount).toHaveText("2");
  });

  test("stopwatch display increases while running", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const display = page.getByTestId("stopwatch-display");
    await expect(display).toHaveText("00:00.000");

    await page.getByRole("button", { name: "Start stopwatch" }).click();

    await expect
      .poll(async () => display.textContent(), {
        message: "stopwatch should advance while running",
      })
      .not.toBe("00:00.000");
  });
});
