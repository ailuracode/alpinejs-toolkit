import { createVideoController } from "../controller/create-video-controller.js";
import { PlayerError } from "../error.js";
import { createReactiveVideoSurface } from "../internal/reactive-surface.js";
import type { PlayerAlpine } from "../types.js";

type DirectiveUtilities = {
  cleanup: (cb: () => void) => void;
  evaluateLater: (
    expression: string
  ) => (receiver?: () => void, extras?: Record<string, unknown>) => void;
};

/** Registers the `x-video` directive on the Alpine runtime. */
export function registerVideoDirective(Alpine: PlayerAlpine): void {
  Alpine.directive(
    "video",
    (el, { expression }, { cleanup, evaluateLater }: DirectiveUtilities) => {
      if (!(el instanceof HTMLVideoElement)) {
        throw new PlayerError(
          "x-video must be used on an HTMLVideoElement",
          "PLAYER_INVALID_ELEMENT"
        );
      }

      const trimmed = expression.trim();
      if (!trimmed) {
        throw new PlayerError(
          'x-video requires a scope variable name (for example x-video="player")',
          "PLAYER_MISSING_EXPRESSION"
        );
      }

      const controller = createVideoController(el);
      const { surface, unsubscribe } = createReactiveVideoSurface(Alpine, controller);
      controller.mount();

      const assign = evaluateLater(`${trimmed} = __player__`);
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op receiver, matches Alpine's x-model directive.
      assign(() => {}, { scope: { __player__: surface } });

      cleanup(() => {
        unsubscribe();
        controller.destroy();
      });
    }
  );
}
