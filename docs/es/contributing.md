# Contribuir

## Estructura del repositorio

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
test/          configuración compartida de Vitest y helpers
docs/          documentación
```

Cada paquete contiene:

- `src/index.ts` — código fuente del plugin
- `test/` — pruebas del paquete
- `README.md` — resumen del paquete
- `package.json` — manifiesto npm independiente

## Configuración

```bash
pnpm install
```

## Comprobaciones de CI

| Job | Comando | Cuándo |
|-----|---------|------|
| Lint | `pnpm run lint` | en cada push / PR |
| Test | `pnpm test` | Node 22 |
| Coverage | `pnpm run test:coverage` | Node 22 (≥80% líneas, ≥70% funciones) |
| Pack | `pnpm run pack:check` | valida tarballs npm |
| Audit | `pnpm audit --audit-level critical` | bloquea CVEs críticos |
| Changeset | `pnpm run changeset:check` | solo PRs — requiere changeset cuando cambia `packages/*` |

Dependabot abre PRs semanales para actualizaciones de pnpm y GitHub Actions.

## Ejecutar pruebas

```bash
pnpm test                    # all tests
pnpm run test:coverage       # with coverage thresholds
pnpm run lint                # biome check (strict)
pnpm run lint:fix            # auto-fix
pnpm run pack:check          # validate publish tarballs
pnpm run changeset:check origin/master
```

Las pruebas usan [Vitest](https://vitest.dev/) con [happy-dom](https://github.com/capricorn86/happy-dom).

### Helpers de prueba

- `test/setup.js` — mock de `matchMedia`, reset de `localStorage`, limpieza del DOM
- `test/helpers.js` — `startAlpine(...plugins)` para pruebas de integración de stores
- `test/mock-alpine.js` — mock mínimo de Alpine para plugins magic-only

## Convenciones

### Stores vs magics

Prefiere stores para estado mutable compartido; magics para datos de entorno de solo lectura o utilidades.

### Nomenclatura

- Scope del paquete: `@ailuracode/alpine-*`
- Getters booleanos: `isLight`, `isOnline`, `isLocked` (sin `()` en plantillas)
- Métodos para acciones: `set()`, `lock()`, `cycle()`
- Evita patrones React (`use*Store`, hooks)

### CSS

Los plugins deben permanecer agnósticos al framework CSS. El estilo DOM pertenece a la app consumidora (vía callbacks como `theme({ onChange })` o `scroll({ onLockChange })`).

## Añadir un paquete nuevo

1. Crea `packages/my-feature/` con `src/index.ts`, `package.json`, `test/`, `README.md`
2. Añade `"name": "@ailuracode/alpine-my-feature"` con `peerDependencies.alpinejs`
3. Añade docs en `docs/my-feature.md` y enlázalo desde el README raíz
4. Asegúrate de que `pnpm test` pase

## Versionado

Este repo usa [Changesets](https://github.com/changesets/changesets) para versionado independiente de paquetes.

### Añadir un changeset

Tras un cambio visible para el usuario:

```bash
pnpm run changeset
```

Selecciona paquete(s), bump semver (`patch` / `minor` / `major`) y escribe un resumen breve en inglés.

**Paquetes nuevos** deben empezar en `"version": "0.0.0"` en `package.json`. Con un changeset `minor`, la primera release será `0.1.0`. Empezar en `0.1.0` provoca un bump automático a `0.2.0` aunque nunca se haya publicado `0.1.0`.

### Release automatizado (GitHub)

1. Abre un PR con tus cambios y un changeset.
2. El workflow **Release** aplica changesets pendientes en **la misma rama del PR** y empuja bumps de versión + CHANGELOGs de vuelta a ese PR (solo cuando `changeset version` cambia archivos).
3. Haz merge del PR a `master` (ya incluye el commit de versión).
4. El workflow **Release** en `master` publica solo paquetes cuyas versiones aún no están en npm.

Requiere un secret del repositorio:

| Secret | Descripción |
|--------|-------------|
| `NPM_TOKEN` | token granular de npm con acceso de publicación a `@ailuracode` |

### Release manual

```bash
pnpm run version   # apply pending changesets
pnpm run release   # test + publish to npm
```

No incrementes `version` en `package.json` manualmente para releases.

## Publicación (manual)

```bash
npm login
pnpm run release
```

Requiere 2FA de npm o un token de acceso granular con permisos de publicación.

## Licencia

MIT — consulta los archivos `package.json` de cada paquete.
