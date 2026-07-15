import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-player", () => {
  test("binds a reactive audio controller in scope", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.evaluate(() => {
      const audio = document.getElementById("audio-el") as HTMLAudioElement | null;
      if (!audio) {
        return;
      }
      audio.play = async () => undefined;
    });

    await page.getByRole("button", { name: "Toggle audio" }).click();

    await page.evaluate(() => {
      const audio = document.getElementById("audio-el") as HTMLAudioElement | null;
      if (!audio) {
        return;
      }
      Object.defineProperty(audio, "paused", { configurable: true, writable: true, value: false });
      audio.dispatchEvent(new Event("play"));
    });

    await expect(page.getByTestId("audio-state")).toHaveText("playing");
  });

  test("updates video mute state through the controller", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByTestId("video-muted")).toHaveText("unmuted");
    await page.getByRole("button", { name: "Toggle mute" }).click();
    await expect(page.getByTestId("video-muted")).toHaveText("muted");
  });
});
