/**
 * Alpine.js integration for `@ailuracode/alpine-calendar`.
 *
 * Thin adapter — registers callable `$calendar` magic that creates
 * reactive calendar instances backed by {@link CalendarController}.
 * No domain logic lives here.
 *
 * @module
 */

import type AlpineType from "alpinejs";
import { buildReactiveInstance, CalendarController } from "./controller.js";
import type { CalendarOptions } from "./types.js";

/** Alpine.js calendar plugin. Registers callable magic `$calendar`. */
export default function calendarPlugin(Alpine: AlpineType.Alpine): void {
  Alpine.magic("calendar", () => {
    return (options?: CalendarOptions) => {
      return Alpine.reactive(buildReactiveInstance(new CalendarController(options)));
    };
  });
}

export {
  CalendarController,
  createCalendar,
  createCalendarController,
  createCalendarMagic,
} from "./controller.js";
