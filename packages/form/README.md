# @ailuracode/alpine-form

Headless form state and validation for Alpine.js. Register fields, track `dirty` / `touched` / `valid` / `submitting`, run sync and async validation, map server errors (including JSON:API pointers), and reset — without rendering controls or replacing `x-model`.

## Install

```bash
pnpm add @ailuracode/alpine-form @ailuracode/alpine-core alpinejs
```

## Quick start

```js
import Alpine from "alpinejs";
import { formPlugin } from "@ailuracode/alpine-form";

Alpine.plugin(formPlugin({
  defaultValidateOn: "submit",
}));

Alpine.start();
```

The plugin registers `$store.form` and the `$form` magic.

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

Use `createForm()` for an API aligned with [TanStack Form](https://tanstack.com/form):

```ts
import { createForm } from "@ailuracode/alpine-form";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = createForm({
  defaultValues: { email: "", password: "" },
  validators: {
    onSubmit: signUpSchema,
  },
  onSubmit: async ({ value }) => {
    await fetch("/api/signup", { method: "POST", body: JSON.stringify(value) });
  },
});

const email = form.field("email", {
  onChange: ({ value }) => (value ? undefined : "Required"),
  onChangeAsyncDebounceMs: 300,
  onChangeAsync: async ({ value }) => {
    const taken = await checkEmailTaken(value);
    return taken ? "Email already registered" : undefined;
  },
});

email.handleChange("user@example.com");
email.handleBlur();

await form.handleSubmit();
```

### Field API

| Member | TanStack equivalent | Description |
|--------|---------------------|-------------|
| `field(name, validators?)` | `form.Field` | Returns a field handle |
| `handleChange(value)` | `field.handleChange` | Updates value + runs `onChange` validators |
| `handleBlur()` | `field.handleBlur` | Marks touched + runs `onBlur` validators |
| `state.value` | `field.state.value` | Current field value |
| `state.meta.errors` | `field.state.meta.errors` | All active error messages |
| `state.meta.errorMap` | `field.state.meta.errorMap` | Errors keyed by trigger (`onChange`, `onBlur`, `onSubmit`) |
| `parseValueWithSchema(schema)` | `fieldApi.parseValueWithSchema` | Validate a value with Standard Schema |

### Form API

| Member | TanStack equivalent | Description |
|--------|---------------------|-------------|
| `handleSubmit()` | `form.handleSubmit` | Validates with `onSubmit` validators then calls `onSubmit` |
| `state.values` | `form.state.values` | Current form values |
| `state.canSubmit` | `form.state.canSubmit` | `true` when the form has no errors |
| `state.isPristine` | `form.state.isPristine` | `true` when no field is dirty |
| `state.errorMap` | `form.state.errorMap` | Form-level errors by trigger |

## Zod and Standard Schema

The package does **not** bundle Zod. Any library implementing [Standard Schema v1](https://github.com/standard-schema/standard-schema) works via duck typing:

```ts
import { createStandardSchemaAdapter, isStandardSchema } from "@ailuracode/alpine-form";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

const form = createForm({
  defaultValues: { email: "" },
  validators: { onSubmit: schema },
});

$store.form.register("signup", {
  initialValues: { email: "" },
  adapter: createStandardSchemaAdapter(schema),
});
```

Supported schema libraries (when they expose `~standard`): **Zod**, **Valibot**, **ArkType**, **Effect/Schema**.

## Store API

### Per-form state

| Property | Type | Description |
|----------|------|-------------|
| `values` | `Record<string, unknown>` | Current form values (supports nested paths) |
| `initialValues` | `Record<string, unknown>` | Values captured at registration / reset baseline |
| `committedValues` | `Record<string, unknown>` | Values after the last successful submit |
| `fields` | `Record<string, FieldState>` | Per-field metadata keyed by path |
| `dirty` | `boolean` | `true` when any field differs from its initial value |
| `touched` | `boolean` | `true` when any field was blurred |
| `valid` | `boolean` | `true` when there are no validation errors |
| `invalid` | `boolean` | `true` when field or form errors exist |
| `validating` | `boolean` | `true` while async validation is in flight |
| `submitting` | `boolean` | `true` while a submit handler is running |
| `submitted` | `boolean` | `true` after a successful submit |
| `formErrors` | `readonly string[]` | Non-field errors |

### Methods

| Method | Description |
|--------|-------------|
| `register(id, options?)` | Register a form instance |
| `unregister(id)` | Remove a form and abort in-flight work |
| `registerField(formId, path, options?)` | Register a field with optional validator |
| `unregisterField(formId, path)` | Remove a dynamic field |
| `setValue(formId, path, value)` | Update a field value |
| `touch(formId, path)` | Mark a field as touched |
| `validate(formId)` | Run validators and return whether the form is valid |
| `submit(formId, handler)` | Validate then run the submit handler |
| `reset(formId, options?)` | Reset to initial or committed values |
| `setServerErrors(formId, fieldErrors, formErrors?)` | Apply server-side validation errors |
| `fieldProps(formId, path, options?)` | Headless ARIA props (`aria-invalid`, `aria-describedby`) |
| `focusFirstError(formId, root?)` | Focus the first invalid field inside a root element |
| `announceErrors(formId, liveRegion?)` | Build and optionally announce an error summary |

### Avoiding name collisions

If your application already owns a `$store.form` or another toolkit plugin registers on that name, rename the integration surface without touching the controller:

```ts
Alpine.plugin(formPlugin({
  storeKey: "formkit",
  magicKey: "formState",
}));
```

`storeKey` is the only argument most hosts need. `magicKey` moves independently only when both names must be freed. The exposed constants `DEFAULT_FORM_STORE_KEY` and `DEFAULT_FORM_MAGIC_KEY` keep the rename discoverable from TypeScript.

## Validation adapters

Use `ValidationAdapter` for cross-field or async validation without bundling a schema library:

```ts
import { composeValidationAdapters, createFieldValidatorsAdapter } from "@ailuracode/alpine-form";

const adapter = composeValidationAdapters([
  createFieldValidatorsAdapter({
    email: (value) => (value ? null : "Required"),
  }),
  {
    async validate(values, { signal }) {
      if (signal.aborted) {
        return { valid: true };
      }
      return values.password === values.confirm
        ? { valid: true }
        : { fieldErrors: { confirm: ["Passwords must match"] } };
    },
  },
]);
```

## JSON:API server errors

```ts
import { mapJsonApiErrors } from "@ailuracode/alpine-form";

const { fieldErrors, formErrors } = mapJsonApiErrors(response.errors);
$store.form.setServerErrors("signup", fieldErrors, formErrors);
```

Pointers like `/data/attributes/email` map to the `email` field path.

## Accessibility

- Bind `fieldProps()` for `aria-invalid` and `aria-describedby`.
- Mark controls with `data-form-field="path"` so `focusFirstError()` can move focus on submit.
- Pipe `announceErrors()` into a live region for screen-reader announcements.

## Standalone usage (no Alpine)

```ts
import { createFormController } from "@ailuracode/alpine-form";

const form = createFormController();
form.register("signup", { initialValues: { email: "" } });
form.registerField("signup", "email", {
  validate: (value) => (value ? null : "Required"),
});

form.on("change", (detail) => {
  console.log(detail.formId, detail.source);
});
```

## Non-goals

- Rendering inputs or labels
- Replacing `x-model`
- Bundling Zod, Yup, or other schema libraries

## License

MIT
