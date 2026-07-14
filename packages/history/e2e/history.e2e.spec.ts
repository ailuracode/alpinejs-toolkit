import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-history", () => {
  test("initializes with the initial value and empty stacks", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByTestId("value")).toHaveText("0");
    await expect(page.getByTestId("can-undo")).toHaveText("false");
    await expect(page.getByTestId("can-redo")).toHaveText("false");
    await expect(page.getByTestId("undo-depth")).toHaveText("0");
    await expect(page.getByTestId("redo-depth")).toHaveText("0");
  });

  test("commits a new value on increment and updates undo/redo state", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Increment" }).click();

    await expect(page.getByTestId("value")).toHaveText("1");
    await expect(page.getByTestId("can-undo")).toHaveText("true");
    await expect(page.getByTestId("can-redo")).toHaveText("false");
    await expect(page.getByTestId("undo-depth")).toHaveText("1");
  });

  test("undo restores the previous value and enables redo", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Increment" }).click();
    await expect(page.getByTestId("value")).toHaveText("1");

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("value")).toHaveText("0");
    await expect(page.getByTestId("can-redo")).toHaveText("true");
  });

  test("redo re-applies the undone value", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Increment" }).click();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("value")).toHaveText("0");

    await page.getByRole("button", { name: "Redo" }).click();
    await expect(page.getByTestId("value")).toHaveText("1");
    await expect(page.getByTestId("can-redo")).toHaveText("false");
  });

  test("new commit after undo clears the redo stack", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Increment" }).click();
    await page.getByRole("button", { name: "Increment" }).click();
    await expect(page.getByTestId("value")).toHaveText("2");

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("value")).toHaveText("1");
    await expect(page.getByTestId("can-redo")).toHaveText("true");

    await page.getByRole("button", { name: "Decrement" }).click();
    await expect(page.getByTestId("value")).toHaveText("0");
    await expect(page.getByTestId("can-redo")).toHaveText("false");
  });

  test("clear empties both undo and redo stacks", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Increment" }).click();
    await page.getByRole("button", { name: "Increment" }).click();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("can-redo")).toHaveText("true");

    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByTestId("can-undo")).toHaveText("false");
    await expect(page.getByTestId("can-redo")).toHaveText("false");
    await expect(page.getByTestId("undo-depth")).toHaveText("0");
    await expect(page.getByTestId("redo-depth")).toHaveText("0");
  });

  test("checkpoint adds an entry without changing the value", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Increment" }).click();
    await expect(page.getByTestId("value")).toHaveText("1");
    await expect(page.getByTestId("undo-depth")).toHaveText("1");

    await page.getByRole("button", { name: "Checkpoint" }).click();
    await expect(page.getByTestId("value")).toHaveText("1");
    await expect(page.getByTestId("undo-depth")).toHaveText("2");
  });

  test("transaction commit adds a single undo entry", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByTestId("undo-depth")).toHaveText("0");

    await page.getByRole("button", { name: "Transaction commit" }).click();
    await expect(page.getByTestId("value")).toHaveText("5");
    await expect(page.getByTestId("undo-depth")).toHaveText("1");
  });

  test("transaction rollback does not add an undo entry", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByTestId("undo-depth")).toHaveText("0");

    await page.getByRole("button", { name: "Transaction rollback" }).click();
    await expect(page.getByTestId("value")).toHaveText("0");
    await expect(page.getByTestId("undo-depth")).toHaveText("0");
  });

  test("undo button is disabled when there is nothing to undo", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  test("redo button is disabled when there is nothing to redo", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("button", { name: "Redo" })).toBeDisabled();
  });
});
