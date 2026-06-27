import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { getLocaleDetectScript } from "./src/locale-detect.ts";
import { pluginDocsSidebarItems } from "./src/plugin-nav.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const pkg = (name: string) => `${root}../../packages/${name}/src/index.ts`;

const sidebar = [
  {
    label: "Playground",
    translations: { es: "Playground", pt: "Playground" },
    link: "/playground/",
  },
  {
    label: "Guides",
    translations: { es: "Guías", pt: "Guias" },
    items: [
      {
        label: "Getting started",
        translations: { es: "Primeros pasos", pt: "Primeiros passos" },
        link: "/getting-started/",
      },
      {
        label: "Core",
        translations: { es: "Core", pt: "Core" },
        link: "/core/",
      },
    ],
  },
  {
    label: "Essentials",
    translations: { es: "Esenciales", pt: "Essenciais" },
    items: pluginDocsSidebarItems("essential"),
  },
  {
    label: "Extended",
    translations: { es: "Extendidos", pt: "Estendidos" },
    items: pluginDocsSidebarItems("extended"),
  },
  {
    label: "Advanced",
    translations: { es: "Avanzados", pt: "Avançados" },
    items: pluginDocsSidebarItems("advanced"),
  },
  {
    label: "Query",
    translations: { es: "Query", pt: "Query" },
    items: [
      {
        label: "Query cache",
        translations: { es: "Caché de consultas", pt: "Cache de consultas" },
        link: "/query/",
      },
      {
        label: "Query devtools",
        translations: { es: "Query devtools", pt: "Query devtools" },
        link: "/query-devtools/",
      },
    ],
  },
];

// https://astro.build/config
export default defineConfig({
  site: "https://alpine-demo-ten.vercel.app",
  integrations: [
    starlight({
      title: {
        en: "Alpine.js Toolkit · @ailuracode",
        es: "Alpine.js Toolkit · @ailuracode",
        pt: "Alpine.js Toolkit · @ailuracode",
      },
      description: "Modular Alpine.js toolkit — lazy init, headless plugins, modern TypeScript DX.",
      defaultLocale: "root",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        es: {
          label: "Español",
          lang: "es",
        },
        pt: {
          label: "Português",
          lang: "pt",
        },
      },
      logo: { src: "./public/logo.png", alt: "ailuracode" },
      routeMiddleware: ["./src/route-data.ts"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/ailuracode/alpinejs-toolkit",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/ailuracode/alpinejs-toolkit/edit/master/docs/",
      },
      head: [
        {
          tag: "script",
          content: getLocaleDetectScript(),
        },
      ],
      sidebar,
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": `${root}src`,
        "@ailuracode/alpinejs-attention": pkg("attention"),
        "@ailuracode/alpinejs-battery": pkg("battery"),
        "@ailuracode/alpinejs-calendar": pkg("calendar"),
        "@ailuracode/alpinejs-clipboard": pkg("clipboard"),
        "@ailuracode/alpinejs-core": pkg("core"),
        "@ailuracode/alpinejs-toast": pkg("toast"),
        "@ailuracode/alpinejs-export": pkg("export"),
        "@ailuracode/alpinejs-geo": pkg("geo"),
        "@ailuracode/alpinejs-json-api": pkg("json-api"),
        "@ailuracode/alpinejs-network": pkg("network"),
        "@ailuracode/alpinejs-notify": pkg("notify"),
        "@ailuracode/alpinejs-platform": pkg("platform"),
        "@ailuracode/alpinejs-query": pkg("query"),
        "@ailuracode/alpinejs-query-adapter-alpine": pkg("query-adapter-alpine"),
        "@ailuracode/alpinejs-query-adapter-nanostores": pkg("query-adapter-nanostores"),
        "@ailuracode/alpinejs-query-adapter-zustand": pkg("query-adapter-zustand"),
        "@ailuracode/alpinejs-query-devtools": pkg("query-devtools"),
        "@ailuracode/alpinejs-screen": pkg("screen"),
        "@ailuracode/alpinejs-sidebar": pkg("sidebar"),
        "@ailuracode/alpinejs-scroll": pkg("scroll"),
        "@ailuracode/alpinejs-share": pkg("share"),
        "@ailuracode/alpinejs-theme": pkg("theme"),
        "@ailuracode/alpinejs-toggle": pkg("toggle"),
        "@ailuracode/alpinejs-touch": pkg("touch"),
        "@ailuracode/alpinejs-visibility": pkg("visibility"),
      },
    },
  },
});
