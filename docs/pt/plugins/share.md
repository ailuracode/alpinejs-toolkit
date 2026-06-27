---
title: "Share"
description: "Web Share API com o magic $share."
---

Package: `@ailuracode/alpinejs-share`

Wrapper leve em torno da [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share). Registra o magic chamável `$share`.

## Instalação

```bash
npm install @ailuracode/alpinejs-share alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import share from "@ailuracode/alpinejs-share";

Alpine.plugin(share);
Alpine.start();
```

Consumidores TypeScript podem adicionar:

```ts
/// <reference types="@ailuracode/alpinejs-share/global" />
```

## Magic API

Chamável como `$clipboard`:

| Uso | Retorno | Descrição |
|-------|---------|-------------|
| `await $share(data)` | `Promise<boolean>` | Abre a folha de compartilhamento nativa. Resolve `true` em sucesso, `false` em cancelamento, negação ou payloads não suportados. Nunca lança exceções. |
| `$share.isSupported` | `boolean` (getter) | `true` quando `navigator.share` está disponível em contexto seguro. |
| `$share.canShare(data?)` | `boolean` | Usa `navigator.canShare` quando presente; caso contrário verifica campos compartilháveis. Sem `data`, retorna se o compartilhamento está disponível em geral. |

Use `$share.isSupported` sem parênteses nos templates.

`data` segue o formato `ShareData` da plataforma (`title`, `text`, `url`, `files`).

## Exemplos HTML

### Compartilhar página atual

```html
<button
  x-show="$share.isSupported"
  @click="shared = await $share({
    title: document.title,
    url: window.location.href
  })"
>
  Share
</button>
```

### Proteger com `canShare`

```html
<button
  x-show="$share.canShare({ title: 'News', url: articleUrl })"
  @click="await $share({ title: 'News', url: articleUrl })"
>
  Share article
</button>
```

### Feedback no componente

```html
<div
  x-data="{
  status: 'idle',
  async sharePage() {
    const ok = await $share({
      title: document.title,
      url: window.location.href
    });
    this.status = ok ? 'shared' : 'cancelled';
    setTimeout(() => this.status = 'idle', 2000);
  }
}"
>
  <button type="button" @click="sharePage()">Share</button>
  <p x-show="status === 'shared'" x-cloak>Thanks for sharing!</p>
  <p x-show="status === 'cancelled'" x-cloak>Share cancelled.</p>
</div>
```

## Suporte ao navegador

- Exige um **contexto seguro** (HTTPS ou `localhost`)
- Suportado na maioria dos navegadores móveis e em alguns navegadores desktop
- `navigator.canShare` é opcional; o plugin faz fallback para verificações básicas de payload
- Compartilhamento de arquivos depende de `navigator.canShare` e suporte da plataforma

## Segurança

`navigator.share` deve ser disparado por um gesto do usuário (clique). Chame `$share()` a partir de handlers de eventos, não no carregamento da página.
