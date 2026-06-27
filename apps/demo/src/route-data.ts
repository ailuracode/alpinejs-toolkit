import { defineRouteMiddleware } from "@astrojs/starlight/route-data";

interface TocNode {
  slug: string;
  children?: TocNode[];
}

/** Astro 7 + Starlight heading anchors can emit duplicate heading metadata; dedupe before render. */
function dedupeTocItems<T extends TocNode>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.flatMap((item) => {
    if (seen.has(item.slug)) {
      return [];
    }

    seen.add(item.slug);

    return [
      {
        ...item,
        children: item.children?.length ? dedupeTocItems(item.children) : item.children,
      },
    ];
  });
}

export const onRequest = defineRouteMiddleware((context, next) => {
  const { toc } = context.locals.starlightRoute;

  if (toc?.items) {
    toc.items = dedupeTocItems(toc.items);
  }

  return next();
});
