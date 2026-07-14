# @ailuracode/alpine-form

Headless form state and validation for Alpine.js. Register fields, track `dirty` / `touched` / `valid` / `submitting`, run sync and async validation, map server errors (including JSON:API pointers), and reset — without rendering controls or replacing `x-model`.

**[Full documentation →](../../docs/plugins/form.md)**

## Install

```bash
pnpm add @ailuracode/alpine-form alpinejs
```

## Quick example

```ts
import Alpine from "alpinejs";
import { formPlugin } from "@ailuracode/alpine-form";

Alpine.plugin(formPlugin());
Alpine.start();
```

```html
<form
  x-data
  x-init="$store.form.register('signup', { initialValues: { email: '', password: '' } });
           $store.form.registerField('signup', 'email', { validate: v => v ? null : 'Required' });
           $store.form.registerField('signup', 'password', { validate: v => v ? null : 'Required' })"
  @submit.prevent="$store.form.submit('signup', async values => { /* fetch… */ })"
>
  <input
    data-form-field="email"
    x-bind="$store.form.fieldProps('signup', 'email', { errorId: 'email-error' })"
    x-model="$store.form.instances.signup.values.email"
    @blur="$store.form.touch('signup', 'email')"
  />
  <p id="email-error" x-show="$store.form.instances.signup.fields.email.errors.length" x-text="$store.form.instances.signup.fields.email.errors[0]"></p>
</form>
```

## TanStack Form-like API

```ts
import { createForm } from "@ailuracode/alpine-form";
import { z } from "zod";

const form = createForm({
  defaultValues: { email: "" },
  validators: { onSubmit: z.object({ email: z.string().email() }) },
  onSubmit: async ({ value }) => save(value),
});

const email = form.field("email", {
  onChange: ({ value }) => (value ? undefined : "Required"),
});

email.handleChange("user@example.com");
await form.handleSubmit();
```

## API summary

| | |
|-|-|
| **Store** | `$store.form` |
| **Magic** | `$form` |
| **Factory** | `createForm({ defaultValues, validators, onSubmit })` — TanStack Form-like API |
| **Schema** | Standard Schema v1 (Zod 3.24+, Valibot, ArkType) via `validators` or `createStandardSchemaAdapter()` |
| **Headless** | `createFormController()` / `FormController` |

## Standalone usage (no Alpine)

```ts
import { createFormController } from "@ailuracode/alpine-form";

const form = createFormController();
form.register("signup", { initialValues: { email: "" } });
form.registerField("signup", "email", {
  validate: (value) => (value ? null : "Required"),
});
```

## License

MIT
