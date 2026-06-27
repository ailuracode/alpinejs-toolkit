Documentación y demos interactivas de plugins headless de Alpine.js por ailuracode.

## ¿Qué es esto?

**@ailuracode/alpine** es un monorepo de plugins independientes de Alpine.js. Cada paquete se publica en npm como `@ailuracode/alpine-<name>`.

| Tipo | Ejemplos | Úsalo cuando |
|------|----------|--------------|
| **Store** | `$store.theme`, `$store.scroll` | Estado mutable compartido y acciones entre componentes |
| **Magic** | `$network`, `$toast`, `$clipboard` | Datos del entorno o utilidades puntuales |
| **Core** | `createQueryClient`, `query({ adapter })` | Infraestructura agnóstica al store |

Los plugins nunca incluyen CSS ni markup específico de un framework: conectas los estilos mediante callbacks y tus propios componentes.

## Explorar

- [Primeros pasos](./getting-started.md) — instalar, registrar plugins, usar en HTML
- [Playground](/playground/) — demos interactivas en vivo para cada plugin
- [Plugins](./theme.md) — referencia de API por paquete (barra lateral)
