---
description: 'Security rules for @ailuracode/alpinejs-toolkit. Always loaded.'
---

# Secrets & Security

## Forbidden patterns

- `eval(...)` and `new Function(...)` are PROHIBITED in any package source, including inside the head snippet.
- Direct `document.write` / `document.writeln` is PROHIBITED.
- Inline event handler strings (`onclick="..."`) in template output are PROHIBITED.
- `dangerouslySetInnerHTML`-style attribute injection is PROHIBITED in Alpine `x-html` use. If a binding returns HTML, the consumer MUST accept it via `x-html` explicitly — packages do not emit HTML strings.

## Bindings & user-supplied data

- `x-text` MUST only receive strings that have been validated or come from a trusted source. The toolkit MUST NOT pass unfiltered user input to `x-text`.
- Bindings that surface user data MUST escape by default. A package MAY provide an explicit `unsafeBind(value)` opt-in only when ARIA semantics require raw markup; it MUST be a separate API surface, not the default.
- Controllers that store user-supplied values MUST round-trip them through the registered storage adapter — direct `localStorage.setItem` with the raw value is PROHIBITED.

## CSP & nonces

- The head snippet (`buildHeadScript`) MUST support a `nonce` option that propagates into the generated `<script>` tag.
- Packages MUST NOT inject inline `<script>` tags at runtime.
- Consumers are responsible for setting their CSP headers; packages are responsible for honoring the nonce when one is provided.

## Secrets

- Test fixtures with fake API keys MUST use obviously fake values (`"test-key"`, `"sk_test_xxx"`). Real keys are PROHIBITED in any source file.
- `.env` MUST NOT be committed. The repository's `.gitignore` already covers this — do not loosen it.

## Inputs

- Any package that consumes JSON from a server MUST call `JSON.parse` inside `try` / `catch` and emit a `ToolkitError('INVALID_PAYLOAD', { cause })`. Empty `catch {}` blocks are PROHIBITED.

## Dependencies

- A new dependency that pulls hundreds of transitive deps MUST be justified in the ADR.
- Packages MUST NOT bundle a copy of an external dependency when it is already a peer or expected runtime dep.
