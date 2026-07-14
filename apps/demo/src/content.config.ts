import { defineCollection } from "astro:content";
import { i18nLoader } from "@astrojs/starlight/loaders";
import { docsSchema, i18nSchema } from "@astrojs/starlight/schema";
import { combinedDocsLoader } from "./loaders/combined-docs-loader.js";

export const collections = {
  docs: defineCollection({ loader: combinedDocsLoader(), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
