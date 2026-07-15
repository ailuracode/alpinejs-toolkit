/**
 * Alpine.js integration for `@ailuracode/alpine-calendar`.
 *
 * Thin adapter — registers callable `$calendar` magic that creates
 * reactive calendar instances backed by {@link CalendarController}.
 * No domain logic lives here.
 *
 * @module
 */

import { guardMagic } from "@ailuracode/alpine-core";
import type AlpineType from "alpinejs";
import { buildReactiveInstance, CalendarController } from "./controller.js";
import type { CalendarOptions, CreateCalendarPluginOptions } from "./types.js";
import { DEFAULT_CALENDAR_MAGIC_KEY } from "./types.js";

/** Alpine.js calendar plugin. Registers callable magic `$calendar`. */
export function calendarPlugin(
  options: CreateCalendarPluginOptions
): (Alpine: AlpineType.Alpine) => void;
export function calendarPlugin(Alpine: AlpineType.Alpine): void;
export function calendarPlugin(
  optionsOrAlpine?: CreateCalendarPluginOptions | AlpineType.Alpine
): ((Alpine: AlpineType.Alpine) => void) | void {
  if (optionsOrAlpine && typeof (optionsOrAlpine as AlpineType.Alpine).magic === "function") {
    // Direct Alpine registration — `Alpine.plugin(calendarPlugin)`.
    // Magic key falls back to the default since no options were passed.
    registerCalendar(optionsOrAlpine as AlpineType.Alpine, {});
    return;
  }

  const options = (optionsOrAlpine as CreateCalendarPluginOptions | undefined) ?? {};
  return (alpine: AlpineType.Alpine) => {
    registerCalendar(alpine, options);
  };
}

function registerCalendar(Alpine: AlpineType.Alpine, options: CreateCalendarPluginOptions): void {
  const magicKey = options.magicKey ?? DEFAULT_CALENDAR_MAGIC_KEY;

  guardMagic(
    Alpine,
    magicKey,
    () => {
      return (calendarOptions?: CalendarOptions) => {
        return Alpine.reactive(buildReactiveInstance(new CalendarController(calendarOptions)));
      };
    },
    "calendar"
  );
}

export default calendarPlugin;

export {
  CalendarController,
  createCalendar,
  createCalendarController,
  createCalendarMagic,
} from "./controller.js";
