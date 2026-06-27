import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const pkg = (name: string) => `${root}../packages/${name}/src/index.ts`;

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
        label: "Contributing",
        translations: { es: "Contribuir", pt: "Contribuir" },
        link: "/contributing/",
      },
      {
        label: "Core",
        translations: { es: "Core", pt: "Core" },
        link: "/core/",
      },
    ],
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
  {
    label: "Plugins",
    translations: { es: "Plugins", pt: "Plugins" },
    items: [{ autogenerate: { directory: "plugins" } }],
  },
];

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: {
        en: "Alpine.js + @ailuracode",
        es: "Alpine.js + @ailuracode",
        pt: "Alpine.js + @ailuracode",
      },
      description: "Documentation and interactive demos for @ailuracode Alpine.js plugins",
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
          href: "https://github.com/ailuracode/alpine",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/ailuracode/alpine/edit/master/docs/",
      },
      sidebar,
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": `${root}src`,
        "@ailuracode/alpine-attention": pkg("attention"),
        "@ailuracode/alpine-battery": pkg("battery"),
        "@ailuracode/alpine-calendar": pkg("calendar"),
        "@ailuracode/alpine-clipboard": pkg("clipboard"),
        "@ailuracode/alpine-toast": pkg("toast"),
        "@ailuracode/alpine-export": pkg("export"),
        "@ailuracode/alpine-geo": pkg("geo"),
        "@ailuracode/alpine-json-api": pkg("json-api"),
        "@ailuracode/alpine-network": pkg("network"),
        "@ailuracode/alpine-notify": pkg("notify"),
        "@ailuracode/alpine-platform": pkg("platform"),
        "@ailuracode/alpine-query": pkg("query"),
        "@ailuracode/alpine-query-adapter-alpine": pkg("query-adapter-alpine"),
        "@ailuracode/alpine-query-adapter-nanostores": pkg("query-adapter-nanostores"),
        "@ailuracode/alpine-query-adapter-zustand": pkg("query-adapter-zustand"),
        "@ailuracode/alpine-query-devtools": pkg("query-devtools"),
        "@ailuracode/alpine-screen": pkg("screen"),
        "@ailuracode/alpine-sidebar": pkg("sidebar"),
        "@ailuracode/alpine-scroll": pkg("scroll"),
        "@ailuracode/alpine-share": pkg("share"),
        "@ailuracode/alpine-theme": pkg("theme"),
        "@ailuracode/alpine-toggle": pkg("toggle"),
        "@ailuracode/alpine-touch": pkg("touch"),
        "@ailuracode/alpine-visibility": pkg("visibility"),
      },
    },
  },
});
