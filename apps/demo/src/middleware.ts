import { defineMiddleware } from "astro:middleware";
import { localizedPlaygroundRedirectTarget } from "./locale-detect.ts";

export const onRequest = defineMiddleware((context, next) => {
  const target = localizedPlaygroundRedirectTarget(context.url.pathname);

  if (target) {
    return context.redirect(target);
  }

  return next();
});
