---
title: "Theme"
description: "Modos claro, escuro e sistema com $store.theme."
---

Package: `@ailuracode/alpinejs-theme`

Gerencia a preferência de tema claro, escuro e do sistema com persistência em `localStorage`. Agnóstico a framework CSS — você controla como o tema é aplicado ao DOM.

## Instalação

```bash
npm install @ailuracode/alpinejs-theme alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpinejs-theme";

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
