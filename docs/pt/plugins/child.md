---
title: "Child"
description: "Package: @ailuracode/alpine-child"
---

Package: `@ailuracode/alpine-child`

Diretiva `x-child` inspirada no padrão **asChild** do Radix UI e shadcn/ui. Transfere atributos, classes, estilos e bindings Alpine do wrapper para o primeiro filho elemento real — e depois remove o wrapper do DOM.

## Instalação

```bash
pnpm install @ailuracode/alpine-child alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import { childPlugin } from "@ailuracode/alpine-child";

Alpine.plugin(childPlugin());
Alpine.start();
```

## Uso básico

```html
<span
  x-child
  class="inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
  @click="alert('clicked')"
>
  <a href="/docs">Ir para docs</a>
</span>
```

Após a inicialização do Alpine:

```html
<a
  href="/docs"
  class="inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
  @click="alert('clicked')"
>
  Ir para docs
</a>
```

## Comparação com `asChild`

Em bibliotecas React:

```jsx
<Button asChild>
  <a href="/docs">Docs</a>
</Button>
```

Com Alpine e markup compatível com Blade:

```html
<span x-child class="btn" role="button">
  <a href="/docs">Docs</a>
</span>
```

| Aspecto | `asChild` (React) | `x-child` (Alpine) |
|---------|-------------------|---------------------|
| Nó DOM extra | Evitado com `cloneElement` | Evitado ao desembrulhar o DOM |
| Fusão de classes | Específica da biblioteca | Tokens de `class` fundidos |
| Eventos | Merge de props | `@click` / `x-on:*` copiados para o filho |
| HTML no servidor | N/A | O wrapper existe até a hidratação |

Use `x-child` ao construir **primitivos Alpine headless** ou **componentes Blade** que não devem forçar um `<span>` ou `<div>` em torno de links e botões.

## Como funciona

1. Durante `Alpine.initTree()`, o plugin intercepta elementos com `x-child`.
2. Localiza o **primeiro filho elemento** (ignora texto e comentários).
3. Funde atributos no filho conforme o modo ativo.
4. Substitui o wrapper pelo filho no DOM.
5. O Alpine inicializa o filho para que as diretivas transferidas se vinculem corretamente.

## Modificadores

```html
<div x-child>
  <button type="button">Padrão</button>
</div>

<div x-child.merge>
  <button type="button">Merge explícito</button>
</div>

<div x-child.replace>
  <button type="button">Wrapper vence conflitos</button>
</div>
```

### Padrão / `.merge`

- `class` — fundida; tokens do filho primeiro, depois do wrapper (`custom btn`)
- `style` — fundido; propriedades do filho vencem em conflito
- Outros atributos — copiados apenas quando ausentes no filho
- `id`, `aria-*`, `data-*` existentes no filho — preservados

### `.replace`

- Valores do wrapper sobrescrevem os do filho em conflitos
- `class` e `style` ainda fundem listas de tokens/propriedades

## Eventos

Handlers declarativos no wrapper são copiados para o filho:

```html
<span x-child @click="open = true" @keydown.escape="open = false">
  <button type="button">Open</button>
</span>
```

O botão recebe ambos os handlers. O scope vem do ancestral `x-data` mais próximo, ou de `x-data` transferido do wrapper.

Chamadas runtime com `addEventListener` no wrapper **não** são movidas.

## Exemplo com componente Blade

```blade
{{-- components/ui/button.blade.php --}}
<span
    x-child
    {{ $attributes->class(['inline-flex items-center rounded-md px-4 py-2 text-sm font-medium']) }}
>
    {{ $slot }}
</span>
```

```blade
<x-ui.button type="button" @click="save()">
    <button type="submit">Save</button>
</x-ui.button>
```

O botão submit mantém `type="submit"` enquanto herda classes de layout e `@click` da raiz do componente.

## O que não é copiado

- `x-child` em si
- `x-ignore`, `x-teleport`, `x-cloak`
- Internos de transition / teleport que poderiam dupla-inicializar

## Limitações

- **Filho único** — apenas o primeiro filho elemento é promovido; irmãos extras são removidos com o wrapper desanexado.
- **Sem filho elemento** — registra um warning no console e deixa o markup inalterado.
- **Compatível com estático** — pensado para markup Blade/SSR que inclui o wrapper no HTML.
- **Não usar em wrappers `x-for`** — use um wrapper estável em torno de um único filho.
- **Listeners programáticos** — apenas atributos declarativos Alpine são transferidos.

## Recomendações

- Prefira um filho semântico (`<a>`, `<button>`) e coloque a apresentação no wrapper.
- Mantenha um único filho interativo por wrapper.
- Coloque estado compartilhado em um `x-data` pai quando o wrapper não deve ter scope próprio.
- Use `.replace` quando a raiz do componente deve impor atributos de acessibilidade.

## Playground

Demo interativa em `/playground/child/` do site de documentação.
