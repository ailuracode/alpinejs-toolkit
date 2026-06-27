---
title: "Export"
description: "Exportar datos a CSV, JSON y otros formatos con $export."
---

Package: `@ailuracode/alpinejs-export`

Inicia descargas de archivos en el navegador desde plantillas Alpine mediante el magic `$export`. Soporta URLs, blobs, archivos y texto plano. Nunca lanza excepciones — se resuelve a `true` en caso de éxito y `false` en caso de fallo.

> **Nota:** Este paquete se publica como `alpine-export` (no `alpine-download`) porque npm bloquea nuevos nombres de paquete que contengan la palabra "download".

## Instalación

```bash
npm install @ailuracode/alpinejs-export alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import exportPlugin from "@ailuracode/alpinejs-export";

Alpine.plugin(exportPlugin);
Alpine.start();
```

Los consumidores de TypeScript pueden añadir:

```ts
/// <reference types="@ailuracode/alpinejs-export/global" />
```

## Magic API

Invocable como `$clipboard` y `$share`:

| Uso | Devuelve | Descripción |
|-------|---------|-------------|
| `await $export(source, options?)` | `Promise<boolean>` | Inicia una descarga de archivo. Se resuelve a `true` en caso de éxito, `false` cuando no está soportado o es inválido. Nunca lanza excepciones. |
| `$export.isSupported` | `boolean` (getter) | `true` cuando las exportaciones basadas en anchor están disponibles. |

Usa `$export.isSupported` sin paréntesis en las plantillas.

### `source`

| Tipo | Comportamiento |
|------|----------|
| Cadena URL (`https://…`, `/path`, `data:…`, `blob:…`) | Abre un `<a download>` temporal apuntando a la URL |
| Cadena de texto plano | Requiere un nombre de archivo; se guarda como blob de texto |
| `Blob` / `File` | Se guarda mediante `URL.createObjectURL` |

### `options`

Pasa un nombre de archivo abreviado o un objeto de opciones:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `filename` | `string` | Nombre sugerido para la descarga |
| `mimeType` | `string` | Tipo MIME para exportaciones de texto plano (predeterminado: `text/plain;charset=utf-8`) |

## Ejemplos HTML

### Exportar texto

```html
<button @click="await $export('Hello world', 'hello.txt')">
  Download text
</button>
```

### Exportar una URL

```html
<button @click="await $export('/assets/guide.pdf', 'guide.pdf')">
  Download PDF
</button>
```

### Exportar JSON generado

```html
<div
  x-data="{
    exportData() {
      const payload = JSON.stringify({ savedAt: Date.now() }, null, 2);
      return $export(payload, {
        filename: 'export.json',
        mimeType: 'application/json'
      });
    }
  }"
>
  <button type="button" @click="exportData()">Export JSON</button>
</div>
```

### Feedback del componente

```html
<div
  x-data="{
    status: 'idle',
    async saveReport() {
      const ok = await $export(reportText, 'report.txt');
      this.status = ok ? 'saved' : 'failed';
      setTimeout(() => this.status = 'idle', 2000);
    }
  }"
>
  <button type="button" @click="saveReport()">Save report</button>
  <p x-show="status === 'saved'" x-cloak>Download started.</p>
  <p x-show="status === 'failed'" x-cloak>Export failed.</p>
</div>
```

## Compatibilidad con navegadores

- Funciona en todos los navegadores modernos con soporte de `<a download>`
- Las URLs de origen cruzado pueden abrirse en una nueva pestaña en lugar de descargarse cuando el servidor no envía cabeceras CORS permisivas — aloja archivos en el mismo origen o usa exportaciones blob para contenido generado
- Las exportaciones de `File` y `Blob` usan URLs de objeto y funcionan sin conexión

## Seguridad

Las exportaciones deben iniciarse con un gesto del usuario (clic). Llama a `$export()` desde manejadores de eventos, no al cargar la página.
