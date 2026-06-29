import ArrowDownUp from "@lucide/astro/icons/arrow-down-up";
import Bell from "@lucide/astro/icons/bell";
import Braces from "@lucide/astro/icons/braces";
import Calendar from "@lucide/astro/icons/calendar";
import Database from "@lucide/astro/icons/database";
import Focus from "@lucide/astro/icons/focus";
import Globe from "@lucide/astro/icons/globe";
import Languages from "@lucide/astro/icons/languages";
import LayoutDashboard from "@lucide/astro/icons/layout-dashboard";
import MapPin from "@lucide/astro/icons/map-pin";
import MessageSquare from "@lucide/astro/icons/message-square";
import Monitor from "@lucide/astro/icons/monitor";
import Palette from "@lucide/astro/icons/palette";
import PanelLeft from "@lucide/astro/icons/panel-left";
import Puzzle from "@lucide/astro/icons/puzzle";
import Replace from "@lucide/astro/icons/replace";
import Send from "@lucide/astro/icons/send";
import ToggleLeft from "@lucide/astro/icons/toggle-left";

type PluginNavIcon = typeof Puzzle;

const PLUGIN_NAV_ICONS: Record<string, PluginNavIcon> = {
  overview: LayoutDashboard,
  theme: Palette,
  sidebar: PanelLeft,
  media: Monitor,
  scroll: ArrowDownUp,
  geo: MapPin,
  lang: Languages,
  env: Globe,
  transfer: Send,
  toggle: ToggleLeft,
  child: Replace,
  toast: MessageSquare,
  attention: Focus,
  notify: Bell,
  calendar: Calendar,
  query: Database,
  "query-kit": Database,
  "json-api": Braces,
};

export function getPluginNavIcon(id: string): PluginNavIcon {
  return PLUGIN_NAV_ICONS[id] ?? Puzzle;
}
