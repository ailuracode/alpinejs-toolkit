---
title: "Theme"
description: "Modos claro, escuro e sistema com $store.theme."
---

Package: `@ailuracode/alpine-theme`

Gerencia a preferência de tema claro, escuro e do sistema com persistência em `localStorage`, sincronização entre abas e estratégia de DOM plugável. O estado é dividido em três campos ortogonais — `current` (escolha do usuário), `system` (preferência do SO) e `resolved` (valor efetivo) — e exposto reativamente via `$store.theme` e a magic `$theme`.

## Instalação

```bash
pnpm install @ailuracode/alpine-theme @ailuracode/alpine-toggle @ailuracode/alpine-core alpinejs
```

## Modelo de estado

Três observáveis independentes em `$store.theme`:

| Campo      | Significado                                  | Valores                          |
| ---------- | -------------------------------------------- | -------------------------------- |
| `current`  | A seleção do usuário                         | `'light' \| 'dark' \| 'system'`  |
| `system`   | Preferência do SO, atualizada via `matchMedia` | `'light' \| 'dark'`              |
| `resolved` | Tema efetivo aplicado à página               | `'light' \| 'dark'`              |

Exemplos:

- Usuário escolheu `system`, SO escuro → `current='system'`, `system='dark'`, `resolved='dark'`.
- Usuário escolheu `light`, SO escuro → `current='light'`, `system='dark'`, `resolved='light'`.
- Usuário escolheu `dark`, SO claro → `current='dark'`, `system='light'`, `resolved='dark'`.

`resolved` se atualiza automaticamente quando o SO muda **apenas** se `current === 'system'`. Uma escolha explícita (`light` / `dark`) congela `resolved` diante de mudanças do SO.

## Configuração

O plugin aplica o tema a `<html>` por padrão. Escolha uma das duas estratégias incluídas.

### Estratégia class (padrão — Tailwind, shadcn)

```js
import Alpine from "alpinejs";
import { themePlugin } from "@ailuracode/alpine-theme";

Alpine.plugin(themePlugin({
  strategy: "class",      // padrão
  darkClass: "dark",
  lightClass: "light",
  defaultTheme: "system", // opcional, padrão: "system"
  storageKey: "theme",    // opcional, padrão: "theme"
}));

Alpine.start();
```

```html
<html class="dark"></html>
```

### Estratégia attribute

```js
Alpine.plugin(themePlugin({ strategy: "attribute", attribute: "data-theme" }));
```

```html
<html data-theme="dark"></html>
```

O plugin inicializa no registro (antes de `Alpine.start()`), portanto o tema resolvido está no DOM antes do primeiro paint.

## API do store

### Estado (leitura direta — sem getters)

```html
<p>Escolha:   <span x-text="$store.theme.current"></span></p>
<p>SO:        <span x-text="$store.theme.system"></span></p>
<p>Aplicado:  <span x-text="$store.theme.resolved"></span></p>

<button :class="{ active: $store.theme.current === 'light' }" @click="$store.theme.set('light')">Light</button>
<button :class="{ active: $store.theme.current === 'dark' }" @click="$store.theme.set('dark')">Dark</button>
<button :class="{ active: $store.theme.current === 'system' }" @click="$store.theme.set('system')">System</button>
```

Comparações diretas são mais legíveis que uma API de um getter por valor e mantêm a superfície do store enxuta.

### Métodos

| Método             | Descrição                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `set(value)`       | Define uma nova preferência (`'light' \| 'dark' \| 'system'`). Persiste, recalcula e aplica.                                       |
| `toggle()`         | Alterna entre `light` e `dark` segundo o tema resolvido. Cria uma **preferência explícita** — NÃO volta para `'system'`.           |
| `reset()`          | Restaura ao padrão configurado e remove o valor persistido.                                                                        |
| `apply()`          | Reaplica o tema resolvido atual ao DOM, ignorando o cache da estratégia. Útil após mutações externas em `<html>` (view transitions do Astro, extensões do navegador, hot reload). |

### Eventos de mudança

Inscreva-se no evento `change` do manager — útil para analytics, espelhamento no servidor ou UI fora do Alpine:

```js
import { themePlugin, createTheme } from "@ailuracode/alpine-theme";

const manager = createTheme({ strategy: "class" });
manager.on("change", (detail) => {
  // detail: { current, system, resolved, source, previous }
  // source: "initialization" | "user" | "system" | "storage" | "reset"
  console.log(detail.source, detail.previous?.resolved, "→", detail.resolved);
});
```

Dentro de um x-data do Alpine, leia `$store.theme` reativamente — o Alpine faz a assinatura por você.

## `resolved` vs `prefersColorScheme`

Ambos se referem a claro/escuro mas respondem a perguntas diferentes:

|                                | `$store.theme.resolved`              | `$store.media.prefersColorScheme` |
| ------------------------------ | ------------------------------------ | --------------------------------- |
| **Pacote**                     | `@ailuracode/alpine-theme`           | `@ailuracode/alpine-media`        |
| **Origem**                     | Preferência do usuário + SO quando `current === 'system'` | Apenas SO, via `matchMedia`       |
| **Mutável**                    | Sim — `set('dark')` altera           | Não — sinal de ambiente somente leitura |
| **Uso**                        | Aplicar estilos (classes, `color-scheme`) | Detectar preferência do SO mesmo com override do usuário |

Podem divergir — um usuário pode forçar escuro enquanto o SO prefere claro:

```js
$store.theme.current            // 'dark'
$store.theme.resolved           // 'dark'
$store.media.prefersColorScheme // 'light' (o SO ainda prefere claro)
```

**Regra prática:**

- **Estilizar o app** → `$store.theme.resolved`
- **Sinal do SO** (analytics, copy condicional, dicas de "seguir sistema") → `$store.media.prefersColorScheme`

Se você usa apenas `@ailuracode/alpine-theme`, `resolved` basta na maioria dos apps. Adicione `@ailuracode/alpine-media` quando também precisar de breakpoints ou outras media features.

```html
<!-- Aplicar o tema -->
<div :class="{ 'dark': $store.theme.resolved === 'dark' }">…</div>

<!-- Mostrar preferência do SO apenas quando o usuário escolheu "system" -->
<p x-show="$store.theme.current === 'system'">
  Preferência do sistema: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

Veja também [Media — tema vs esquema de cor do SO](./media.md#theme-vs-media-color-scheme).

## Prevenção de FOUC

Para páginas sem renderização no servidor, adicione um snippet inline em `<head>` que leia `localStorage` e aplique a classe / atributo **antes** de o Alpine carregar:

```html
<head>
  <script>
    // Ajuste `key` / `className` à sua configuração.
    const key = "theme";
    const saved = localStorage.getItem(key);
    const mode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = mode === "system" ? (dark ? "dark" : "light") : mode;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
  </script>
</head>
```

Em apps gerenciadas pelo Alpine o plugin já faz isso no registro, mas o snippet inline continua sendo a única forma de evitar flash em conexões lentas.

## Tailwind CSS

A estratégia `class` padrão já vem pronta para Tailwind:

```js
Alpine.plugin(themePlugin({ strategy: "class", darkClass: "dark" }));
```

Garanta que o dark mode seja baseado em classe no seu `tailwind.config`:

```js
export default {
  darkMode: "class",
  // …
};
```

```html
<html class="dark">
  <body class="bg-white dark:bg-black text-black dark:text-white">
    <button @click="$store.theme.toggle()">Toggle theme</button>
  </body>
</html>
```

## Migração desde `@ailuracode/alpine-theme@0.x`

| `0.x`                                                                       | `1.x`                                                                                       |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Campo único `mode`                                                          | Três campos independentes: `current` / `system` / `resolved`                              |
| Getters `isLight` / `isDark` / `isSystem` / `isResolvedLight` / `isResolvedDark` | Removidos — leia `$store.theme.current` / `.resolved` diretamente e compare               |
| `set(mode)` / `cycle()` / `refresh()`                                       | `set(value)` / `toggle()` / `reset()`. `cycle()` e `refresh()` deixam de existir.          |
| Callback `onChange` em `themePlugin(options)`                               | `manager.on('change', listener)`. Inscreva-se após `createTheme()` se precisar do callback. |
| Único adaptador `localStorage`                                             | `ThemeStorage` plugável — passe `createLocalStorageThemeStorage({ key })` para manter o padrão. |
