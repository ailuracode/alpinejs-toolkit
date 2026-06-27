Documentação e demos interativas de plugins headless do Alpine.js por ailuracode.

## O que é isto?

**@ailuracode/alpine** é um monorepo de plugins independentes do Alpine.js. Cada pacote é publicado no npm como `@ailuracode/alpine-<name>`.

| Tipo | Exemplos | Use quando |
|------|----------|------------|
| **Store** | `$store.theme`, `$store.scroll` | Estado mutável compartilhado e ações entre componentes |
| **Magic** | `$network`, `$toast`, `$clipboard` | Dados do ambiente ou utilitários pontuais |
| **Core** | `createQueryClient`, `query({ adapter })` | Infraestrutura agnóstica ao store |

Os plugins nunca incluem CSS nem markup específico de framework — você conecta os estilos via callbacks e seus próprios componentes.

## Explorar

- [Primeiros passos](./getting-started.md) — instalar, registrar plugins, usar em HTML
- [Playground](/playground/) — demos interativas ao vivo para cada plugin
- [Plugins](./theme.md) — referência de API por pacote (barra lateral)
