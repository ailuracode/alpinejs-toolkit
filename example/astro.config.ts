import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const pkg = (name: string) => `${root}../packages/${name}/src/index.ts`;

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@ailuracode/alpine-attention": pkg("attention"),
        "@ailuracode/alpine-battery": pkg("battery"),
        "@ailuracode/alpine-calendar": pkg("calendar"),
        "@ailuracode/alpine-clipboard": pkg("clipboard"),
        "@ailuracode/alpine-toast": pkg("toast"),
        "@ailuracode/alpine-export": pkg("export"),
        "@ailuracode/alpine-geo": pkg("geo"),
        "@ailuracode/alpine-network": pkg("network"),
        "@ailuracode/alpine-notify": pkg("notify"),
        "@ailuracode/alpine-platform": pkg("platform"),
        "@ailuracode/alpine-query": pkg("query"),
        "@ailuracode/alpine-query-adapter-alpine": pkg("query-adapter-alpine"),
        "@ailuracode/alpine-query-adapter-nanostores": pkg("query-adapter-nanostores"),
        "@ailuracode/alpine-query-adapter-zustand": pkg("query-adapter-zustand"),
        "@ailuracode/alpine-query-devtools": pkg("query-devtools"),
        "@ailuracode/alpine-screen": pkg("screen"),
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
