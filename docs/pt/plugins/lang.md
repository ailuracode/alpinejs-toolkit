---
title: "Lang"
description: "Pacote: @ailuracode/alpine-lang"
---

Package: `@ailuracode/alpine-lang`

Store reativa do idioma atual para Alpine.js. Detecta o idioma do navegador, expõe `current` / `base` / `region` e a lista completa de `navigator.languages`, e permite alterar o idioma dinamicamente para que todas as expressões do Alpine reajam em tempo real.

O plugin **apenas administra o idioma atual** — não traduz conteúdo. Combine-o com qualquer biblioteca de i18n (i18next, dicionários próprios, etc.) e use o callback `onChange` para carregar as mensagens correspondentes.

## Instalação

```bash
npm install @ailuracode/alpine-lang alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import lang from "@ailuracode/alpine-lang";

Alpine.plugin(lang({
  fallback: "en",    // usado quando navigator.language / navigator.languages não estão disponíveis
  normalize: true,   // minúsculas + converte "_" para "-"
  onChange(language) {
    // recarrega os pacotes de i18n, atualiza <html lang>, persiste, …
    document.documentElement.lang = language;
  },
}));

Alpine.start();
```

`onChange` é chamado após cada alteração bem-sucedida de `current` (incluindo `reset()`).

## Store API

### Estado

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `current` | `string` | Tag de idioma completa normalizada (p. ex. `"es-ec"`) |
| `base` | `string` | Subtag base do idioma atual (p. ex. `"es"`); igual a `current` quando não há região |
| `region` | `string \| null` | Subtag de região (p. ex. `"ec"`); `null` quando não há região |
| `languages` | `readonly string[]` | Cópia de `navigator.languages`, normalizada |
| `fallback` | `string` | Fallback configurado (normalizado quando `normalize: true`) |
| `isDetected` | `boolean` | `true` quando o idioma inicial veio do `navigator` |

### Métodos

| Método | Descrição |
|--------|-----------|
| `is(value)` | `true` quando `value` corresponde a `current` exatamente ou pela base |
| `includes(value)` | `true` quando alguma tag de `navigator.languages` corresponde a `value` (exato ou pela base) |
| `set(language)` | Atualiza o idioma atual; recalcula `base` / `region` e dispara `onChange` |
| `reset()` | Redetecta a partir de `navigator.language` / `navigator.languages` (ou `fallback`) |

`set()` é uma operação sem efeito quando o valor está vazio ou é igual ao atual, para que as expressões do Alpine não sejam reavaliadas desnecessariamente.

## Exemplos HTML

### Troca dinâmica de conteúdo

```html
<p x-show="$store.lang.is('es')">Hola mundo</p>
<p x-show="$store.lang.is('en')">Hello world</p>
<p x-show="$store.lang.is('fr')">Bonjour le monde</p>

<button @click="$store.lang.set('es')">Español</button>
<button @click="$store.lang.set('en')">English</button>
<button @click="$store.lang.set('fr')">Français</button>
```

Ao chamar `set()`, todos os `<p>` cuja visibilidade depende de `$store.lang.is(...)` são atualizados automaticamente, sem recarregar a página.

### Inspecionar o idioma atual

```html
<dl class="text-sm">
  <dt>current</dt><dd x-text="$store.lang.current"></dd>
  <dt>base</dt><dd x-text="$store.lang.base"></dd>
  <dt>region</dt><dd x-text="$store.lang.region ?? '—'"></dd>
  <dt>languages</dt>
  <dd>
    <template x-for="tag in $store.lang.languages" :key="tag">
      <span x-text="tag"></span>
    </template>
  </dd>
</dl>
```

### Redefinir para o idioma do navegador

```html
<button @click="$store.lang.reset()">Redefinir para o idioma do navegador</button>
```

## Opções de configuração

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `fallback` | `string` | `"en"` | Usado quando `navigator.language` e `navigator.languages` não estão disponíveis. É normalizado quando `normalize: true`. |
| `normalize` | `boolean` | `true` | Coloca a tag em minúsculas e converte underscores em hifens (`pt_BR` → `pt-br`). |
| `onChange` | `(language: string) => void` | — | Chamado após cada `set()` / `reset()` bem-sucedido com a tag completa normalizada. |

## Mudança dinâmica de idioma

`$store.lang` é uma store reativa do Alpine. Qualquer expressão do Alpine que a leia (`x-show`, `x-text`, `:class`, getters calculados, etc.) é reavaliada quando muda. O plugin não persiste nada por conta própria — combine-o com `localStorage`, um cookie ou seu backend:

```js
Alpine.plugin(lang({
  fallback: "en",
  onChange(language) {
    localStorage.setItem("lang", language);
    document.documentElement.lang = language;
    loadMessages(language); // seu carregador de i18n
  },
}));

// depois, ao iniciar, hidrate a partir do armazenamento
const saved = localStorage.getItem("lang");
if (saved) Alpine.store("lang").set(saved);
```

## Integração com bibliotecas de i18n

Use o plugin como **fonte única de verdade** do idioma atual. Passe o valor para sua camada de i18n:

```js
import { createI18n } from "vue-i18n"; // ou i18next, etc.

const i18n = createI18n({ legacy: false });

Alpine.plugin(lang({
  fallback: "en",
  onChange(language) {
    i18n.global.locale.value = language;
  },
}));
```

O plugin nunca toca nas tabelas de tradução — ele só administra a tag do idioma *atual*.

## Considerações sobre SSR

- O plugin não falha quando `window` ou `navigator` não existem.
- No servidor ele usa `fallback` até que o cliente hidrate.
- A store é registrada em `Alpine.plugin(...)` e `onChange` **não** é chamado até que o cliente hidrate (a menos que você invoque `set()` manualmente durante SSR).
- Para um HTML determinístico durante SSR, renderize apenas `lang.fallback` / `lang.base` (são estáveis entre servidor e cliente) e deixe `region` / `languages` serem preenchidos após a hidratação.

## Helpers

`normalizeLanguageTag(value)` e `parseLanguageTag(value)` são exportados junto ao plugin padrão para casos avançados (adaptadores personalizados, stores próprias, etc.).

```ts
import { normalizeLanguageTag, parseLanguageTag } from "@ailuracode/alpine-lang";

normalizeLanguageTag("EN_us"); // "en-us"
parseLanguageTag("es-EC"); // { base: "es", region: "EC" }
```