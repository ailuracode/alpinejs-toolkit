import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import AttentionDemo from "../components/demos/AttentionDemo.astro";
import BatteryDemo from "../components/demos/BatteryDemo.astro";
import CalendarDemo from "../components/demos/CalendarDemo.astro";
import ClipboardDemo from "../components/demos/ClipboardDemo.astro";
import ExportDemo from "../components/demos/ExportDemo.astro";
import GeoDemo from "../components/demos/GeoDemo.astro";
import JsonApiDemo from "../components/demos/JsonApiDemo.astro";
import LangDemo from "../components/demos/LangDemo.astro";
import NetworkDemo from "../components/demos/NetworkDemo.astro";
import NotifyDemo from "../components/demos/NotifyDemo.astro";
import PlatformDemo from "../components/demos/PlatformDemo.astro";
import QueryDemo from "../components/demos/QueryDemo.astro";
import ScreenDemo from "../components/demos/ScreenDemo.astro";
import ScrollDemo from "../components/demos/ScrollDemo.astro";
import ShareDemo from "../components/demos/ShareDemo.astro";
import SidebarDemo from "../components/demos/SidebarDemo.astro";
import ThemeDemo from "../components/demos/ThemeDemo.astro";
import ToastDemo from "../components/demos/ToastDemo.astro";
import ToggleDemo from "../components/demos/ToggleDemo.astro";
import TouchDemo from "../components/demos/TouchDemo.astro";
import VisibilityDemo from "../components/demos/VisibilityDemo.astro";
import { PLUGIN_NAV_ITEMS, type PluginNavItem } from "../plugin-nav";

export const PLAYGROUND_DEMOS: Record<string, AstroComponentFactory> = {
  theme: ThemeDemo,
  sidebar: SidebarDemo,
  screen: ScreenDemo,
  scroll: ScrollDemo,
  geo: GeoDemo,
  lang: LangDemo,
  network: NetworkDemo,
  visibility: VisibilityDemo,
  battery: BatteryDemo,
  platform: PlatformDemo,
  touch: TouchDemo,
  toggle: ToggleDemo,
  clipboard: ClipboardDemo,
  toast: ToastDemo,
  export: ExportDemo,
  share: ShareDemo,
  attention: AttentionDemo,
  notify: NotifyDemo,
  calendar: CalendarDemo,
  query: QueryDemo,
  "json-api": JsonApiDemo,
};

export function getPlaygroundDemo(id: string): AstroComponentFactory | undefined {
  return PLAYGROUND_DEMOS[id];
}

export function isPlaygroundPlugin(id: string): id is PluginNavItem["id"] {
  return PLUGIN_NAV_ITEMS.some((item) => item.id === id);
}
