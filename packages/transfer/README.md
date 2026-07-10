# @ailuracode/alpine-transfer

Outbound transfer magics: `$clipboard`, `$share`, and `$export`.

**[Full documentation →](../../docs/plugins/transfer.md)**

## Install

```bash
pnpm add @ailuracode/alpine-transfer @ailuracode/alpine-core alpinejs
```

## Quick example

```ts
import Alpine from "alpinejs";
import transfer from "@ailuracode/alpine-transfer";

Alpine.plugin(transfer());
Alpine.start();
```

## Selective registration

```ts
Alpine.plugin(transfer({ share: false }));
```

## License

MIT
