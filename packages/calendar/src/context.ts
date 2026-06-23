import type {
  ContextOptions,
  Day,
  FirstWeekContainsDateOptions,
  FormatOptions,
  Locale,
  WeekOptions,
} from "date-fns";
import { enUS } from "date-fns/locale";

export type CalendarDateFnsOptions = ContextOptions<Date> &
  WeekOptions &
  FirstWeekContainsDateOptions &
  Pick<FormatOptions, "useAdditionalWeekYearTokens" | "useAdditionalDayOfYearTokens"> & {
    locale?: Locale;
  };

export type ResolvedDateFnsContext = CalendarDateFnsOptions & {
  locale: Locale;
  weekStartsOn: Day;
};

type DateFnsOptionInput = {
  locale?: Locale;
  weekStartsOn?: Day;
  dateFns?: CalendarDateFnsOptions;
};

export function resolveDateFnsContext(options: DateFnsOptionInput = {}): ResolvedDateFnsContext {
  const dateFns = options.dateFns ?? {};

  return {
    ...dateFns,
    locale: options.locale ?? dateFns.locale ?? enUS,
    weekStartsOn: options.weekStartsOn ?? dateFns.weekStartsOn ?? 0,
  };
}
