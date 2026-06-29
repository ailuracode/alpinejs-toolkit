# @ailuracode/alpine-transfer

Outbound transfer magics: `$clipboard`, `$share`, and `$export`.

**[Full documentation →](../../docs/plugins/transfer.md)**

## Install

```bash
npm install @ailuracode/alpine-transfer alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import transfer from "@ailuracode/alpine-transfer";

Alpine.plugin(transfer());
Alpine.start();
```

## Selective registration

```js
Alpine.plugin(transfer({ share: false }));
```

## License

MIT
