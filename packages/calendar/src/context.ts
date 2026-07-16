import { createNativeCalendarDateAdapter, nativeCalendarDateAdapter } from "./adapters/native.js";
import type {
  CalendarDateAdapter,
  CalendarDateAdapterOptions,
  ResolvedCalendarContext,
} from "./adapters/types.js";
import { resolveCalendarContext } from "./adapters/types.js";

export type {
  CalendarDateAdapter,
  CalendarDateAdapterOptions,
  CalendarDateContext,
  CalendarLocale,
  CalendarWeekDay,
  ResolvedCalendarContext,
} from "./adapters/types.js";

/** @deprecated Use {@link ResolvedCalendarContext}. */
export type ResolvedDateFnsContext = ResolvedCalendarContext;

/** @deprecated Use {@link CalendarDateAdapterOptions}. */
export type CalendarDateFnsOptions = CalendarDateAdapterOptions;

type CalendarContextInput = CalendarDateAdapterOptions & {
  adapter?: CalendarDateAdapter;
};

export function resolveCalendarDateContext(
  options: CalendarContextInput = {}
): ResolvedCalendarContext {
  const adapter = options.adapter ?? nativeCalendarDateAdapter;
  return resolveCalendarContext(adapter, options);
}

/** @deprecated Use {@link resolveCalendarDateContext}. */
export function resolveDateFnsContext(options: CalendarContextInput = {}): ResolvedCalendarContext {
  return resolveCalendarDateContext(options);
}

export { createNativeCalendarDateAdapter, nativeCalendarDateAdapter };
