import AppWindow from "@lucide/astro/icons/app-window";
import ArrowDownUp from "@lucide/astro/icons/arrow-down-up";
import Bell from "@lucide/astro/icons/bell";
import Braces from "@lucide/astro/icons/braces";
import Calendar from "@lucide/astro/icons/calendar";
import Command from "@lucide/astro/icons/command";
import Database from "@lucide/astro/icons/database";
import Focus from "@lucide/astro/icons/focus";
import GalleryHorizontal from "@lucide/astro/icons/gallery-horizontal";
import Globe from "@lucide/astro/icons/globe";
import Hand from "@lucide/astro/icons/hand";
import History from "@lucide/astro/icons/history";
import Keyboard from "@lucide/astro/icons/keyboard";
import Languages from "@lucide/astro/icons/languages";
import LayoutDashboard from "@lucide/astro/icons/layout-dashboard";
import LayoutPanelTop from "@lucide/astro/icons/layout-panel-top";
import List from "@lucide/astro/icons/list";
import ListChecks from "@lucide/astro/icons/list-checks";
import ListCollapse from "@lucide/astro/icons/list-collapse";
import MapPin from "@lucide/astro/icons/map-pin";
import Menu from "@lucide/astro/icons/menu";
import MessageCircle from "@lucide/astro/icons/message-circle";
import MessageSquare from "@lucide/astro/icons/message-square";
import Monitor from "@lucide/astro/icons/monitor";
import Palette from "@lucide/astro/icons/palette";
import PanelLeft from "@lucide/astro/icons/panel-left";
import Puzzle from "@lucide/astro/icons/puzzle";
import Replace from "@lucide/astro/icons/replace";
import Send from "@lucide/astro/icons/send";
import ShieldCheck from "@lucide/astro/icons/shield-check";
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
  overlay: LayoutPanelTop,
  permissions: ShieldCheck,
  dialog: AppWindow,
  menu: Menu,
  tooltip: MessageCircle,
  tabs: LayoutPanelTop,
  accordion: ListCollapse,
  command: Command,
  carousel: GalleryHorizontal,
  virtual: List,
  selection: ListChecks,
  keyboard: Keyboard,
  gesture: Hand,
  history: History,
};

export function getPluginNavIcon(id: string): PluginNavIcon {
  return PLUGIN_NAV_ICONS[id] ?? Puzzle;
}
