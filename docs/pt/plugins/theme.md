---
title: "Theme"
description: "Modos claro, escuro e sistema com $store.theme."
---

Package: `@ailuracode/alpine-theme`

Gerencia a preferência de tema claro, escuro e do sistema com persistência em `localStorage`. Agnóstico a framework CSS — você controla como o tema é aplicado ao DOM.

## Instalação

```bash
npm install @ailuracode/alpine-theme alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpine-theme";

Alpine.plugin(theme({
  storageKey: "theme", // opcional, padrão: "theme"
  onChange({ mode, resolved }) {
    // mode: preferência do usuário (light | dark | system)
    // resolved: tema efetivamente aplicado (light | dark)
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  },
}));

Alpine.start();
```

`onChange` é executado na inicialização (antes da primeira renderização, se registrado cedo) e sempre que o tema muda.

## Store API

### Estado

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `mode` | `string` | Preferência do usuário: `light`, `dark` ou `system` |
| `resolved` | `string` | Tema aplicado: `light` ou `dark` |

### Getters

| Getter | Descrição |
|--------|-------------|
| `isLight` | `mode === 'light'` |
| `isDark` | `mode === 'dark'` |
| `isSystem` | `mode === 'system'` |
| `isResolvedLight` | `resolved === 'light'` |
| `isResolvedDark` | `resolved === 'dark'` |

### Métodos

| Método | Descrição |
|--------|-------------|
| `set(mode)` | Define a preferência e persiste em `localStorage` |
| `cycle()` | Alterna: light → dark → system → light |
| `refresh()` | Re-resolve `resolved` (ex.: após mudança de tema do SO) |
| `is(name)` | Genérico: `is('dark')` |
| `isResolved(name)` | Genérico: `isResolved('light')` |

## Exemplos HTML

```html
<button :class="{ active: $store.theme.isLight }" @click="$store.theme.set('light')">
  Light
</button>
<button :class="{ active: $store.theme.isDark }" @click="$store.theme.set('dark')">
  Dark
</button>
<button :class="{ active: $store.theme.isSystem }" @click="$store.theme.set('system')">
  System
</button>

<p>Preference: <span x-text="$store.theme.mode"></span></p>
<p>Applied: <span x-text="$store.theme.resolved"></span></p>
```

## Preferência do sistema

Quando `mode` é `system`, o plugin escuta `prefers-color-scheme` e atualiza `resolved` automaticamente. Nenhuma configuração extra é necessária.

## `resolved` vs `prefersColorScheme`

Ambos se relacionam com claro/escuro, mas respondem perguntas diferentes:

| | `$store.theme.resolved` | `$store.media.prefersColorScheme` |
|---|---|---|
| **Pacote** | `@ailuracode/alpine-theme` | `@ailuracode/alpine-media` |
| **Origem** | Preferência do usuário (`mode`) + SO quando `mode === 'system'` | Apenas SO, via `matchMedia` |
| **Mutável** | Sim — `set('dark')` altera `resolved` | Não — sinal de ambiente somente leitura |
| **Uso** | Aplicar estilos (`onChange`, classes, `color-scheme`) | Detectar preferência do SO mesmo com override do usuário |

Podem divergir. O usuário pode forçar modo escuro enquanto o SO prefere claro:

```js
$store.theme.mode               // 'dark'
$store.theme.resolved           // 'dark'
$store.media.prefersColorScheme // 'light' (o SO ainda prefere claro)
```

**Regra prática:**

- **Estilizar o app** → `$store.theme.resolved` (ou `isResolvedDark` / `isResolvedLight`)
- **Sinal do SO** (analytics, copy condicional, dicas de “seguir sistema”) → `$store.media.prefersColorScheme`

Se você usa apenas `@ailuracode/alpine-theme`, `resolved` basta na maioria dos apps. Adicione `@ailuracode/alpine-media` quando também precisar de breakpoints ou outras media features.

```html
<!-- Aplicar tema na UI -->
<div :class="{ 'dark': $store.theme.isResolvedDark }">...</div>

<!-- Preferência do SO apenas quando o usuário escolheu "system" -->
<p x-show="$store.theme.isSystem">
  Preferência do sistema: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

Veja também [Media — tema vs esquema de cor do SO](./media.md#theme-vs-media-color-scheme).

## Prevenção de FOUC

Registre o plugin e `onChange` o mais cedo possível no seu arquivo de entrada. O plugin inicializa no registro (antes de `Alpine.start()`) para que `onChange` possa ser executado antes da primeira renderização.

Para estilos críticos, adicione CSS inline em `<head>` vinculado ao atributo escolhido (ex.: `[data-theme="dark"]`).

## Tailwind CSS

```js
onChange({ resolved }) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}
```

Ative o modo escuro baseado em classe em `tailwind.config.js`.
