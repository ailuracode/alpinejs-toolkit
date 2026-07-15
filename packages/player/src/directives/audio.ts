import { createAudioController } from "../controller/create-audio-controller.js";
import { PlayerError } from "../error.js";
import { createReactivePlayerSurface } from "../internal/reactive-surface.js";
import type { PlayerAlpine } from "../types.js";

type DirectiveUtilities = {
  cleanup: (cb: () => void) => void;
  evaluateLater: (
    expression: string
  ) => (receiver?: () => void, extras?: Record<string, unknown>) => void;
};

/** Registers the `x-audio` directive on the Alpine runtime. */
export function registerAudioDirective(Alpine: PlayerAlpine): void {
  Alpine.directive(
    "audio",
    (el, { expression }, { cleanup, evaluateLater }: DirectiveUtilities) => {
      if (!(el instanceof HTMLAudioElement)) {
        throw new PlayerError(
          "x-audio must be used on an HTMLAudioElement",
          "PLAYER_INVALID_ELEMENT"
        );
      }

      const trimmed = expression.trim();
      if (!trimmed) {
        throw new PlayerError(
          'x-audio requires a scope variable name (for example x-audio="player")',
          "PLAYER_MISSING_EXPRESSION"
        );
      }

      const controller = createAudioController(el);
      const { surface, unsubscribe } = createReactivePlayerSurface(Alpine, controller);
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
