import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-realtime", () => {
  test("initializes in the disconnected state with no retries", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByTestId("status")).toHaveText("disconnected");
    await expect(page.getByTestId("connection-state")).toHaveText("disconnected");
    await expect(page.getByTestId("is-ready")).toHaveText("false");
    await expect(page.getByTestId("retry-count")).toHaveText("0");
    // The controller binds its `transport` field asynchronously
    // when `setAdapter()` runs; the initial snapshot has it `null`
    // (rendered as empty string). After `Connect` it flips to
    // "sse" — verified in the next test.
    await expect(page.getByTestId("transport")).toHaveText("");
  });

  test("connects on demand and reaches the connected state", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Connect", exact: true }).click();

    await expect(page.getByTestId("status")).toHaveText("connected");
    await expect(page.getByTestId("connection-state")).toHaveText("connected");
    await expect(page.getByTestId("is-ready")).toHaveText("true");
    await expect(page.getByTestId("transport")).toHaveText("sse");
  });

  test("disconnects back to the disconnected state", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(page.getByTestId("status")).toHaveText("connected");

    await page.getByRole("button", { name: "Disconnect", exact: true }).click();

    await expect(page.getByTestId("status")).toHaveText("disconnected");
    await expect(page.getByTestId("connection-state")).toHaveText("disconnected");
    await expect(page.getByTestId("is-ready")).toHaveText("false");
  });

  test("pauses a connected controller and resumes it back to connected", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(page.getByTestId("status")).toHaveText("connected");

    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(page.getByTestId("status")).toHaveText("paused");
    await expect(page.getByTestId("is-ready")).toHaveText("false");

    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect(page.getByTestId("status")).toHaveText("connected");
    await expect(page.getByTestId("is-ready")).toHaveText("true");
  });

  test("exposes the $realtime magic accessor", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    // The probe button reads `$realtime.state.status` and
    // `$realtime.isReady` from inside an x-data method. If the
    // magic is not registered, clicking the button throws and the
    // bound output never updates.
    await page.getByRole("button", { name: "Probe magic" }).click();

    await expect(page.getByTestId("magic-status")).toHaveText("disconnected");
    await expect(page.getByTestId("magic-ready")).toHaveText("false");

    // Connect through the magic surface and probe again to confirm
    // the magic stays in sync with the controller.
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await page.getByRole("button", { name: "Probe magic" }).click();

    await expect(page.getByTestId("magic-status")).toHaveText("connected");
    await expect(page.getByTestId("magic-ready")).toHaveText("true");
  });
});
