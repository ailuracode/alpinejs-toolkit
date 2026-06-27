# Contribuir

## Estrutura do repositório

```
packages/
  theme/       @ailuracode/alpine-theme
  screen/      @ailuracode/alpine-screen
  network/     @ailuracode/alpine-network
  battery/     @ailuracode/alpine-battery
  clipboard/   @ailuracode/alpine-clipboard
  scroll/      @ailuracode/alpine-scroll
  touch/       @ailuracode/alpine-touch
  platform/    @ailuracode/alpine-platform
  notify/      @ailuracode/alpine-notify
  geo/         @ailuracode/alpine-geo
  visibility/  @ailuracode/alpine-visibility
  battery/     @ailuracode/alpine-battery
test/          configuração compartilhada do Vitest e helpers
docs/          documentação
```

Cada pacote contém:

- `src/index.ts` — código-fonte do plugin
- `test/` — testes do pacote
- `README.md` — visão geral do pacote
- `package.json` — manifesto npm independente

## Configuração

```bash
pnpm install
```

## Verificações de CI

| Job | Comando | Quando |
|-----|---------|--------|
| Lint | `pnpm run lint` | a cada push / PR |
| Test | `pnpm test` | Node 22 |
| Coverage | `pnpm run test:coverage` | Node 22 (≥80% linhas, ≥70% funções) |
| Pack | `pnpm run pack:check` | valida tarballs npm |
| Audit | `pnpm audit --audit-level critical` | bloqueia CVEs críticos |
| Changeset | `pnpm run changeset:check` | apenas PRs — exige changeset quando `packages/*` muda |

O Dependabot abre PRs semanais para atualizações do pnpm e GitHub Actions.

## Executar testes

```bash
pnpm test                    # all tests
pnpm run test:coverage       # with coverage thresholds
pnpm run lint                # biome check (strict)
pnpm run lint:fix            # auto-fix
pnpm run pack:check          # validate publish tarballs
pnpm run changeset:check origin/master
```

Os testes usam [Vitest](https://vitest.dev/) com [happy-dom](https://github.com/capricorn86/happy-dom).

### Helpers de teste

- `test/setup.js` — mock de `matchMedia`, reset de `localStorage`, limpeza do DOM
- `test/helpers.js` — `startAlpine(...plugins)` para testes de integração de stores
- `test/mock-alpine.js` — mock mínimo do Alpine para plugins apenas magic

## Convenções

### Stores vs magics

Prefira stores para estado mutável compartilhado; magics para dados de ambiente somente leitura ou utilitários.

### Nomenclatura

- Escopo do pacote: `@ailuracode/alpine-*`
- Getters booleanos: `isLight`, `isOnline`, `isLocked` (sem `()` em templates)
- Métodos para ações: `set()`, `lock()`, `cycle()`
- Evite padrões React (`use*Store`, hooks)

### CSS

Os plugins devem permanecer agnósticos a framework CSS. Estilização DOM pertence ao app consumidor (via callbacks como `theme({ onChange })` ou `scroll({ onLockChange })`).

## Adicionar um pacote novo

1. Crie `packages/my-feature/` com `src/index.ts`, `package.json`, `test/`, `README.md`
2. Adicione `"name": "@ailuracode/alpine-my-feature"` com `peerDependencies.alpinejs`
3. Adicione docs em `docs/my-feature.md` e vincule no README raiz
4. Garanta que `pnpm test` passe

## Versionamento

Este repositório usa [Changesets](https://github.com/changesets/changesets) para versionamento independente de pacotes.

### Adicionar um changeset

Após uma mudança visível ao usuário:

```bash
pnpm run changeset
```

Selecione pacote(s), bump semver (`patch` / `minor` / `major`) e escreva um resumo breve em inglês.

**Pacotes novos** devem começar em `"version": "0.0.0"` no `package.json`. Com um changeset `minor`, a primeira release será `0.1.0`. Começar em `0.1.0` causa bump automático para `0.2.0` mesmo que nada tenha sido publicado em `0.1.0`.

### Release automatizado (GitHub)

1. Abra um PR com suas mudanças e um changeset.
2. O workflow **Release** aplica changesets pendentes na **mesma branch do PR** e envia bumps de versão + CHANGELOGs de volta para esse PR (somente quando `changeset version` altera arquivos).
3. Faça merge do PR em `master` (já inclui o commit de versão).
4. O workflow **Release** em `master` publica apenas pacotes cujas versões ainda não estão no npm.

Requer um secret do repositório:

| Secret | Descrição |
|--------|-------------|
| `NPM_TOKEN` | token granular do npm com acesso de publicação em `@ailuracode` |

### Release manual

```bash
pnpm run version   # apply pending changesets
pnpm run release   # test + publish to npm
```

Não incremente `version` no `package.json` manualmente para releases.

## Publicação (manual)

```bash
npm login
pnpm run release
```

Requer 2FA do npm ou token de acesso granular com permissões de publicação.

## Licença

MIT — consulte os arquivos `package.json` de cada pacote.
