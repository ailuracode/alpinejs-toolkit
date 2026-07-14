---
title: Composición del query stack
description: Elige entre el núcleo agnóstico al store, adaptadores Alpine y Zustand, y el bundle query kit recomendado.
---

La familia Query Stack apila una caché agnóstica al store con adaptadores de reactividad enchufables y un bundle opcional recomendado para apps Alpine.

## Roles de los paquetes

| Paquete | Rol | Cuándo instalar |
|---------|-----|-----------------|
| `@ailuracode/alpine-query` | Fundación | Solo necesitas el motor de caché o un adaptador personalizado |
| `@ailuracode/alpine-query-adapter-alpine` | Adaptador | Integración nativa con `Alpine.reactive` |
| `@ailuracode/alpine-query-adapter-zustand` | Adaptador | Stores vanilla de Zustand enlazados a Alpine |
| `@ailuracode/alpine-query-kit` | Bundle | **Recomendado** para apps Alpine — core, adaptador Nanostores, re-exports y entrada devtools |

El núcleo framework-neutral **no** requiere Alpine. Los adaptadores y el kit añaden cableado compatible con Alpine encima.

## Configuración Alpine recomendada

```ts
import Alpine from "alpinejs";
import { queryKitPlugin } from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKitPlugin());
Alpine.start();
```

Usa `query({ adapter })` desde el re-export del kit cuando necesites control explícito del adaptador en ejemplos o tests.

## Devtools

Query Devtools se publican desde `@ailuracode/alpine-query-kit/devtools` y son herramientas de desarrollo opcionales. Importa la entrada devtools solo en builds de desarrollo.

## Demos relacionados

- [Playground de la familia Query Stack](/playground/data-networking/query-stack/)
- [Demo del núcleo Query](/playground/query/)
- [Demo de Query kit](/playground/query-kit/)
