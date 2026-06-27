import ArrowDownUp from "@lucide/astro/icons/arrow-down-up";
import Battery from "@lucide/astro/icons/battery";
import Bell from "@lucide/astro/icons/bell";
import Braces from "@lucide/astro/icons/braces";
import Calendar from "@lucide/astro/icons/calendar";
import Clipboard from "@lucide/astro/icons/clipboard";
import Database from "@lucide/astro/icons/database";
import Download from "@lucide/astro/icons/download";
import Eye from "@lucide/astro/icons/eye";
import Focus from "@lucide/astro/icons/focus";
import Hand from "@lucide/astro/icons/hand";
import Laptop from "@lucide/astro/icons/laptop";
import LayoutDashboard from "@lucide/astro/icons/layout-dashboard";
import MapPin from "@lucide/astro/icons/map-pin";
import MessageSquare from "@lucide/astro/icons/message-square";
import Monitor from "@lucide/astro/icons/monitor";
import Palette from "@lucide/astro/icons/palette";
import PanelLeft from "@lucide/astro/icons/panel-left";
import Puzzle from "@lucide/astro/icons/puzzle";
import Share2 from "@lucide/astro/icons/share-2";
import ToggleLeft from "@lucide/astro/icons/toggle-left";
import Wifi from "@lucide/astro/icons/wifi";
import type { AstroComponent } from "astro";

const PLUGIN_NAV_ICONS: Record<string, AstroComponent> = {
  overview: LayoutDashboard,
  theme: Palette,
  sidebar: PanelLeft,
  screen: Monitor,
  scroll: ArrowDownUp,
  geo: MapPin,
  network: Wifi,
  visibility: Eye,
  battery: Battery,
  platform: Laptop,
  touch: Hand,
  toggle: ToggleLeft,
  clipboard: Clipboard,
  toast: MessageSquare,
  export: Download,
  share: Share2,
  attention: Focus,
  notify: Bell,
  calendar: Calendar,
  query: Database,
  "json-api": Braces,
};

export function getPluginNavIcon(id: string): AstroComponent {
  return PLUGIN_NAV_ICONS[id] ?? Puzzle;
}
