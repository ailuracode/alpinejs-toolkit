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
      {
        label: "Device detection",
        translations: { es: "Detección de dispositivo", pt: "Detecção de dispositivo" },
        link: "/device-detection/",
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
        link: "/plugins/query-kit/#devtools",
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
        "@ailuracode/alpine-env": pkg("env"),
        "@ailuracode/alpine-transfer": pkg("transfer"),
        "@ailuracode/alpine-query-kit": pkg("query-kit"),
        "@ailuracode/alpine-attention": pkg("attention"),
        "@ailuracode/alpine-calendar": pkg("calendar"),
        "@ailuracode/alpine-child": pkg("child"),
        "@ailuracode/alpine-core": pkg("core"),
        "@ailuracode/alpine-toast": pkg("toast"),
        "@ailuracode/alpine-geo": pkg("geo"),
        "@ailuracode/alpine-json-api": pkg("json-api"),
        "@ailuracode/alpine-lang": pkg("lang"),
        "@ailuracode/alpine-notify": pkg("notify"),
        "@ailuracode/alpine-query": pkg("query"),
        "@ailuracode/alpine-query-adapter-alpine": pkg("query-adapter-alpine"),
        "@ailuracode/alpine-query-adapter-zustand": pkg("query-adapter-zustand"),
        "@ailuracode/alpine-media": pkg("media"),
        "@ailuracode/alpine-sidebar": pkg("sidebar"),
        "@ailuracode/alpine-scroll": pkg("scroll"),
        "@ailuracode/alpine-theme": pkg("theme"),
        "@ailuracode/alpine-toggle": pkg("toggle"),
      },
    },
  },
});
