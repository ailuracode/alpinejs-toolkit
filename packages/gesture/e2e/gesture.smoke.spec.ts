import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-gesture smoke", () => {
  test("exposes the gesture store and wires accessible fixtures", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("heading", { name: "Gesture E2E fixture" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tap me" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Long press me" })).toBeEnabled();
    await expect(page.getByRole("region", { name: "Swipe target" })).toBeVisible();
  });

  test("recognizes a tap and updates the component state", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const target = page.getByRole("button", { name: "Tap me" });
    const result = page.getByTestId("tap-result");

    await expect(result).toHaveText("untouched");
    await target.click();

    await expect(result).toHaveText("tap");
  });

  test("dispatches a CustomEvent on tap that listeners can observe", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const target = document.getElementById("tap-target");
        if (!target) {
          resolve();
          return;
        }
        target.addEventListener("tap", () => resolve(), { once: true });
        // Dispatch full pointer event sequence so the gesture controller
        // recognises the tap regardless of browser pointer-event handling.
        const rect = target.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        target.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: x, clientY: y, pointerId: 1, bubbles: true })
        );
        target.dispatchEvent(
          new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId: 1, bubbles: true })
        );
      });
    });

    await expect(page.getByTestId("tap-result")).toHaveText("tap");
  });

  test("recognizes a horizontal swipe and exposes the direction", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const target = page.getByRole("region", { name: "Swipe target" });
    const result = page.getByTestId("swipe-result");

    await expect(result).toHaveText("none");

    const box = await target.boundingBox();
    if (!box) {
      throw new Error("swipe target has no bounding box");
    }

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // One fast movement that exceeds both swipe distance (50px) and
    // velocity (0.3 px/ms) thresholds.
    await page.mouse.move(startX + 150, startY, { steps: 5 });
    await page.mouse.up();

    await expect(result).toHaveText("right");
  });

  test("recognizes a long press after the configured delay", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const longPressFired = await page.evaluate(() => {
      const target = document.getElementById("longpress-target");
      if (!target) {
        return "missing-target";
      }

      return new Promise<string>((resolve) => {
        target.addEventListener(
          "longpress",
          (event) => {
            const detail = (event as CustomEvent).detail as { kind: string };
            resolve(detail.kind);
          },
          { once: true }
        );

        const box = target.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;

        const pointerId = 1;
        target.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: x, clientY: y, pointerId, bubbles: true })
        );
        setTimeout(() => {
          target.dispatchEvent(
            new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId, bubbles: true })
          );
        }, 600);
      });
    });

    expect(longPressFired).toBe("longpress");
  });

  test("recognizes a pinch spread and updates the scale output", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const result = page.getByTestId("pinch-scale");
    await expect(result).toHaveText("1.00");

    await page.evaluate(() => {
      const target = document.getElementById("pinch-target");
      if (!target) {
        return;
      }

      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const half = 24;

      const pointerOne = {
        downX: centerX - half,
        downY: centerY - half,
        moveX: centerX - half - 40,
        moveY: centerY - half - 40,
      };
      const pointerTwo = {
        downX: centerX + half,
        downY: centerY + half,
        moveX: centerX + half + 40,
        moveY: centerY + half + 40,
      };

      const dispatch = (type: string, x: number, y: number, pointerId: number) => {
        target.dispatchEvent(
          new PointerEvent(type, {
            clientX: x,
            clientY: y,
            pointerId,
            bubbles: true,
            pointerType: "touch",
          })
        );
      };

      dispatch("pointerdown", pointerOne.downX, pointerOne.downY, 1);
      dispatch("pointerdown", pointerTwo.downX, pointerTwo.downY, 2);
      dispatch("pointermove", pointerOne.moveX, pointerOne.moveY, 1);
      dispatch("pointermove", pointerTwo.moveX, pointerTwo.moveY, 2);
      dispatch("pointerup", pointerOne.moveX, pointerOne.moveY, 1);
      dispatch("pointerup", pointerTwo.moveX, pointerTwo.moveY, 2);
    });

    await expect(result).not.toHaveText("1.00");
    const scaleText = await result.textContent();
    expect(Number(scaleText)).toBeGreaterThan(1);
  });
});
